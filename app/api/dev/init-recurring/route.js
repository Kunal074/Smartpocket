import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id VARCHAR(50) NOT NULL DEFAULT 'other',
        amount NUMERIC(12,2) NOT NULL,
        note VARCHAR(255) NOT NULL DEFAULT 'Recurring',
        frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
        next_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return NextResponse.json({ success: true, message: 'Recurring expenses table created' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
