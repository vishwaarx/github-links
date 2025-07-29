// --- START backend/src/routes/submissions.js --- //
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { query } = require('../database');
const { addJob } = require('../queue');
const { captureException } = require('../monitoring');

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Validate GitHub URL
const validateGitHubUrl = (url) => {
  const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+$/;
  return githubRegex.test(url);
};

// Extract repo URLs from textarea
const extractUrlsFromText = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  return lines.filter(url => validateGitHubUrl(url));
};

// Extract repo URLs from CSV
const extractUrlsFromCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const urls = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Look for URL in any column
        Object.values(row).forEach(value => {
          if (validateGitHubUrl(value)) {
            urls.push(value);
          }
        });
      })
      .on('end', () => {
        resolve(urls);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// POST /api/submissions - Submit repo URLs
router.post('/', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: 'URLs array is required and cannot be empty'
      });
    }
    
    // Validate URLs
    const validUrls = urls.filter(url => validateGitHubUrl(url));
    const invalidUrls = urls.filter(url => !validateGitHubUrl(url));
    
    if (validUrls.length === 0) {
      return res.status(400).json({
        error: 'No valid GitHub URLs provided',
        invalidUrls
      });
    }
    
    if (validUrls.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 repositories per batch allowed'
      });
    }
    
    // Create submission record
    const submissionResult = await query(
      'INSERT INTO submissions (total_repos) VALUES ($1) RETURNING id, batch_id',
      [validUrls.length]
    );
    
    const submissionId = submissionResult.rows[0].id;
    const batchId = submissionResult.rows[0].batch_id;
    
    // Create job records and add to queue
    const jobPromises = validUrls.map(async (url) => {
      const jobResult = await query(
        'INSERT INTO jobs (submission_id, repo_url) VALUES ($1, $2) RETURNING id',
        [submissionId, url]
      );
      
      const jobId = jobResult.rows[0].id;
      
      // Add job to queue
      await addJob(url, submissionId, jobId);
      
      return {
        id: jobId,
        repoUrl: url,
        status: 'pending'
      };
    });
    
    const jobs = await Promise.all(jobPromises);
    
    res.status(201).json({
      submissionId,
      batchId,
      totalRepos: validUrls.length,
      jobs,
      invalidUrls,
      message: `Processing ${validUrls.length} repositories`
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'POST /api/submissions' });
    res.status(500).json({
      error: 'Failed to create submission',
      message: error.message
    });
  }
});

// POST /api/submissions/upload - Upload CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'CSV file is required'
      });
    }
    
    // Extract URLs from CSV
    const urls = await extractUrlsFromCSV(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    if (urls.length === 0) {
      return res.status(400).json({
        error: 'No valid GitHub URLs found in CSV file'
      });
    }
    
    if (urls.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 repositories per batch allowed'
      });
    }
    
    // Create submission record
    const submissionResult = await query(
      'INSERT INTO submissions (total_repos) VALUES ($1) RETURNING id, batch_id',
      [urls.length]
    );
    
    const submissionId = submissionResult.rows[0].id;
    const batchId = submissionResult.rows[0].batch_id;
    
    // Create job records and add to queue
    const jobPromises = urls.map(async (url) => {
      const jobResult = await query(
        'INSERT INTO jobs (submission_id, repo_url) VALUES ($1, $2) RETURNING id',
        [submissionId, url]
      );
      
      const jobId = jobResult.rows[0].id;
      
      // Add job to queue
      await addJob(url, submissionId, jobId);
      
      return {
        id: jobId,
        repoUrl: url,
        status: 'pending'
      };
    });
    
    const jobs = await Promise.all(jobPromises);
    
    res.status(201).json({
      submissionId,
      batchId,
      totalRepos: urls.length,
      jobs,
      message: `Processing ${urls.length} repositories from CSV`
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'POST /api/submissions/upload' });
    res.status(500).json({
      error: 'Failed to process CSV file',
      message: error.message
    });
  }
});

// GET /api/submissions/:id - Get submission details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submissionResult = await query(
      `SELECT s.*, 
              COUNT(j.id) as total_jobs,
              COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
              COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed_jobs,
              COUNT(CASE WHEN j.status = 'processing' THEN 1 END) as processing_jobs
       FROM submissions s
       LEFT JOIN jobs j ON s.id = j.submission_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );
    
    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Submission not found'
      });
    }
    
    const submission = submissionResult.rows[0];
    
    // Get jobs for this submission
    const jobsResult = await query(
      'SELECT * FROM jobs WHERE submission_id = $1 ORDER BY created_at',
      [id]
    );
    
    res.json({
      ...submission,
      jobs: jobsResult.rows
    });
    
  } catch (error) {
    captureException(error, { endpoint: 'GET /api/submissions/:id' });
    res.status(500).json({
      error: 'Failed to get submission',
      message: error.message
    });
  }
});

module.exports = router;
// --- END backend/src/routes/submissions.js --- // 