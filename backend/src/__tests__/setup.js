// --- START backend/src/__tests__/setup.js --- //
// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'repo_verifier_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GEMINI_API_KEY = 'test-key';
process.env.SENTRY_DSN = 'https://test@sentry.io/123';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
// --- END backend/src/__tests__/setup.js --- // 