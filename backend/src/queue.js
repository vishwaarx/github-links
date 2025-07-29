// --- START backend/src/queue.js --- //
const { Queue, Worker } = require('bullmq');
const Redis = require('redis');

let redisClient;
let jobQueue;
let jobWorker;

const setupQueue = () => {
  // Redis connection
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect().then(() => {
    console.log('Redis connected successfully');
    setupJobQueue();
  }).catch((err) => {
    console.error('Redis connection failed:', err);
  });
};

const setupJobQueue = () => {
  // Create job queue
  jobQueue = new Queue('repo-verification', {
    connection: redisClient
  });

  // Create worker
  jobWorker = new Worker('repo-verification', async (job) => {
    const { repoUrl, submissionId, jobId } = job.data;
    const { processRepository } = require('./processor');
    
    try {
      console.log(`Processing job ${jobId} for repo: ${repoUrl}`);
      
      // Update job status to processing
      await updateJobStatus(jobId, 'processing');
      
      // Process the repository
      const result = await processRepository(repoUrl, jobId);
      
      // Update job with results
      await updateJobResult(jobId, result);
      
      return result;
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      // Update job with error
      await updateJobResult(jobId, {
        status: 'failed',
        result: false,
        reason: error.message,
        logs: error.stack
      });
      
      throw error;
    }
  }, {
    connection: redisClient,
    concurrency: 2 // Process 2 jobs at a time
  });

  // Handle worker events
  jobWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  jobWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
  });

  console.log('Job queue and worker setup complete');
};

const addJob = async (repoUrl, submissionId, jobId) => {
  if (!jobQueue) {
    throw new Error('Job queue not initialized');
  }

  const job = await jobQueue.add('verify-repo', {
    repoUrl,
    submissionId,
    jobId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    timeout: 5 * 60 * 1000 // 5 minutes
  });

  return job;
};

const getJobStatus = async (jobId) => {
  if (!jobQueue) {
    throw new Error('Job queue not initialized');
  }

  const job = await jobQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data
  };
};

const updateJobStatus = async (jobId, status) => {
  const { query } = require('./database');
  await query(
    'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, jobId]
  );
};

const updateJobResult = async (jobId, result) => {
  const { query } = require('./database');
  await query(
    `UPDATE jobs 
     SET status = $1, result = $2, reason = $3, logs = $4, 
         setup_instructions = $5, execution_time = $6, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $7`,
    [
      result.status || 'completed',
      result.result,
      result.reason,
      result.logs,
      result.setupInstructions,
      result.executionTime,
      jobId
    ]
  );
};

const getQueue = () => jobQueue;
const getWorker = () => jobWorker;

module.exports = {
  setupQueue,
  addJob,
  getJobStatus,
  getQueue,
  getWorker
};
// --- END backend/src/queue.js --- // 