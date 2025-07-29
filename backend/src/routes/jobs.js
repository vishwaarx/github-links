// --- START backend/src/routes/jobs.js --- //
const express = require('express');
const { query } = require('../database');
const { getJobStatus } = require('../queue');
const { captureException } = require('../monitoring');

const router = express.Router();

// GET /api/jobs/:id - Get job details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const jobResult = await query(
      'SELECT * FROM jobs WHERE id = $1',
      [id]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    const job = jobResult.rows[0];
    
    // Get queue status if job is still pending/processing
    if (job.status === 'pending' || job.status === 'processing') {
      try {
        const queueStatus = await getJobStatus(job.id);
        if (queueStatus) {
          job.queueStatus = queueStatus.status;
          job.progress = queueStatus.progress;
        }
      } catch (queueError) {
        console.error('Error getting queue status:', queueError);
      }
    }
    
    res.json(job);
    
  } catch (error) {
    captureException(error, { endpoint: 'GET /api/jobs/:id' });
    res.status(500).json({
      error: 'Failed to get job',
      message: error.message
    });
  }
});

// GET /api/jobs - List all jobs with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, submission_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (submission_id) {
      const operator = whereClause ? 'AND' : 'WHERE';
      whereClause += `${operator} submission_id = $${paramIndex}`;
      params.push(submission_id);
      paramIndex++;
    }
    
    // Get jobs with pagination
    const jobsResult = await query(
      `SELECT j.*, s.batch_id 
       FROM jobs j 
       LEFT JOIN submissions s ON j.submission_id = s.id 
       ${whereClause}
       ORDER BY j.created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM jobs j 
       LEFT JOIN submissions s ON j.submission_id = s.id 
       ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      jobs: jobsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'GET /api/jobs' });
    res.status(500).json({
      error: 'Failed to get jobs',
      message: error.message
    });
  }
});

// GET /api/jobs/:id/logs - Get job logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    
    const jobResult = await query(
      'SELECT logs, setup_instructions, reason FROM jobs WHERE id = $1',
      [id]
    );
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }
    
    const job = jobResult.rows[0];
    
    res.json({
      logs: job.logs || '',
      setupInstructions: job.setup_instructions || '',
      reason: job.reason || ''
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'GET /api/jobs/:id/logs' });
    res.status(500).json({
      error: 'Failed to get job logs',
      message: error.message
    });
  }
});

// GET /api/jobs/stats - Get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_jobs,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs,
        COUNT(CASE WHEN result = true THEN 1 END) as successful_jobs,
        COUNT(CASE WHEN result = false THEN 1 END) as unsuccessful_jobs,
        AVG(execution_time) as avg_execution_time
      FROM jobs
    `);
    
    const stats = statsResult.rows[0];
    
    // Get recent activity
    const recentJobsResult = await query(`
      SELECT id, repo_url, status, result, created_at 
      FROM jobs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    res.json({
      stats,
      recentJobs: recentJobsResult.rows
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'GET /api/jobs/stats/overview' });
    res.status(500).json({
      error: 'Failed to get job statistics',
      message: error.message
    });
  }
});

module.exports = router;
// --- END backend/src/routes/jobs.js --- // 