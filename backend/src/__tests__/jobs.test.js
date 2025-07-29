// --- START backend/src/__tests__/jobs.test.js --- //
const request = require('supertest');
const app = require('../server');

describe('Jobs API', () => {
  describe('GET /api/jobs', () => {
    it('should return jobs with pagination', async () => {
      const response = await request(app)
        .get('/api/jobs?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('should filter jobs by status', async () => {
      const response = await request(app)
        .get('/api/jobs?status=pending')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      // All returned jobs should have pending status
      response.body.jobs.forEach(job => {
        expect(job.status).toBe('pending');
      });
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return job details', async () => {
      // First create a submission to get a job ID
      const createResponse = await request(app)
        .post('/api/submissions')
        .send({
          urls: ['https://github.com/username/repo1']
        });

      const jobId = createResponse.body.jobs[0].id;

      const response = await request(app)
        .get(`/api/jobs/${jobId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', jobId);
      expect(response.body).toHaveProperty('repo_url');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/jobs/999999')
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET /api/jobs/:id/logs', () => {
    it('should return job logs', async () => {
      // First create a submission to get a job ID
      const createResponse = await request(app)
        .post('/api/submissions')
        .send({
          urls: ['https://github.com/username/repo1']
        });

      const jobId = createResponse.body.jobs[0].id;

      const response = await request(app)
        .get(`/api/jobs/${jobId}/logs`)
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('setupInstructions');
      expect(response.body).toHaveProperty('reason');
    });

    it('should return 404 for non-existent job logs', async () => {
      const response = await request(app)
        .get('/api/jobs/999999/logs')
        .expect(404);

      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET /api/jobs/stats/overview', () => {
    it('should return job statistics', async () => {
      const response = await request(app)
        .get('/api/jobs/stats/overview')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('recentJobs');
      expect(response.body.stats).toHaveProperty('total_jobs');
      expect(response.body.stats).toHaveProperty('completed_jobs');
      expect(response.body.stats).toHaveProperty('failed_jobs');
      expect(response.body.stats).toHaveProperty('successful_jobs');
      expect(response.body.stats).toHaveProperty('unsuccessful_jobs');
    });
  });
});
// --- END backend/src/__tests__/jobs.test.js --- // 