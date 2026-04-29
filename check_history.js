const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'smartpocket_db',
  port: 5432,
});

async function run() {
  try {
    const res = await pool.query('SELECT * FROM expense_history');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
