import { Pool } from 'pg';

// Reuse pool across hot-reloads in development
const globalForPg = globalThis;

const pool =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg._pgPool = pool;
}

/**
 * Run a parameterised query and return rows.
 * @param {string} text  - SQL query string
 * @param {any[]}  params - Query parameters
 */
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export default pool;
