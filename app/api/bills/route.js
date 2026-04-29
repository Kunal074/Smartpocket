import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Ensure personal_bills table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS personal_bills (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      category VARCHAR(50) DEFAULT 'other',
      note TEXT DEFAULT '',
      date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

// GET /api/bills - Fetch all personal bills for current user
export const GET = withAuth(async (request, user) => {
  try {
    await ensureTable();
    const result = await query(
      'SELECT * FROM personal_bills WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [user.id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching personal bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
});

// POST /api/bills - Create a new personal bill
export const POST = withAuth(async (request, user) => {
  try {
    await ensureTable();
    const body = await request.json();
    const { title, amount, category = 'other', note = '', date } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: 'Title and amount are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO personal_bills (user_id, title, amount, category, note, date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::DATE, CURRENT_DATE))
       RETURNING *`,
      [user.id, title, parseFloat(amount), category, note, date || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating personal bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
});
