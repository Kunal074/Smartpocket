const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/smartpocket', // Assuming default local dev db based on standard
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID REFERENCES group_expenses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Successfully created expense_comments table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();
