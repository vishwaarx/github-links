// --- START backend/src/database.js --- //
const { Pool } = require('pg');

let pool;

const setupDatabase = () => {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'repo_verifier',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection failed:', err);
    } else {
      console.log('Database connected successfully');
      createTables();
    }
  });
};

const createTables = async () => {
  const createSubmissionsTable = `
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      batch_id UUID DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      total_repos INTEGER,
      processed_repos INTEGER DEFAULT 0
    );
  `;

  const createJobsTable = `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
      repo_url VARCHAR(500) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      result BOOLEAN,
      reason TEXT,
      logs TEXT,
      setup_instructions TEXT,
      execution_time INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createSubmissionsTable);
    await pool.query(createJobsTable);
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

const getPool = () => pool;

const query = (text, params) => pool.query(text, params);

module.exports = {
  setupDatabase,
  getPool,
  query
};
// --- END backend/src/database.js --- // 