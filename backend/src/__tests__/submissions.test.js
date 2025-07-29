// --- START backend/src/__tests__/submissions.test.js --- //
const request = require('supertest');
const app = require('../server');

describe('Submissions API', () => {
  describe('POST /api/submissions', () => {
    it('should create a submission with valid URLs', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({
          urls: [
            'https://github.com/username/repo1',
            'https://github.com/username/repo2'
          ]
        })
        .expect(201);

      expect(response.body).toHaveProperty('submissionId');
      expect(response.body).toHaveProperty('batchId');
      expect(response.body.totalRepos).toBe(2);
      expect(response.body.jobs).toHaveLength(2);
      expect(response.body.message).toContain('Processing 2 repositories');
    });

    it('should reject empty URLs array', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({ urls: [] })
        .expect(400);

      expect(response.body.error).toBe('URLs array is required and cannot be empty');
    });

    it('should reject invalid GitHub URLs', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({
          urls: [
            'https://github.com/username/repo1',
            'https://invalid-url.com/repo',
            'not-a-url'
          ]
        })
        .expect(400);

      expect(response.body.error).toBe('No valid GitHub URLs provided');
      expect(response.body.invalidUrls).toHaveLength(2);
    });

    it('should reject more than 10 URLs', async () => {
      const urls = Array.from({ length: 11 }, (_, i) => `https://github.com/username/repo${i}`);
      
      const response = await request(app)
        .post('/api/submissions')
        .send({ urls })
        .expect(400);

      expect(response.body.error).toBe('Maximum 10 repositories per batch allowed');
    });
  });

  describe('GET /api/submissions/:id', () => {
    it('should return submission details', async () => {
      // First create a submission
      const createResponse = await request(app)
        .post('/api/submissions')
        .send({
          urls: ['https://github.com/username/repo1']
        });

      const submissionId = createResponse.body.submissionId;

      // Then get the submission details
      const response = await request(app)
        .get(`/api/submissions/${submissionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', submissionId);
      expect(response.body).toHaveProperty('batch_id');
      expect(response.body).toHaveProperty('total_repos', 1);
      expect(response.body).toHaveProperty('jobs');
      expect(response.body.jobs).toHaveLength(1);
    });

    it('should return 404 for non-existent submission', async () => {
      const response = await request(app)
        .get('/api/submissions/999999')
        .expect(404);

      expect(response.body.error).toBe('Submission not found');
    });
  });
});
// --- END backend/src/__tests__/submissions.test.js --- // 