import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Drop old table if it has wrong column type
    await query(`DROP TABLE IF EXISTS recurring_expenses`);
    await query(`
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        category_id VARCHAR(50) NOT NULL DEFAULT 'other',
        amount NUMERIC(12,2) NOT NULL,
        note VARCHAR(255) NOT NULL DEFAULT 'Recurring',
        frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
        next_date DATE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS recurring_user_note_freq 
      ON recurring_expenses(user_id, note, frequency)
    `);

    return NextResponse.json({ success: true, message: 'Recurring expenses table created' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
