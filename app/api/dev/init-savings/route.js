import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        target_amount NUMERIC(12,2) NOT NULL,
        saved_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        target_date DATE,
        icon VARCHAR(10) DEFAULT '🎯',
        color VARCHAR(20) DEFAULT '#5A67D8',
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    return NextResponse.json({ success: true, message: 'Savings goals table created' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
