import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Initialize savings_challenges table
export async function GET() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS savings_challenges (
        id                    SERIAL PRIMARY KEY,
        user_id               UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        month                 VARCHAR(7)     NOT NULL,
        target_amount         NUMERIC(12,2)  NOT NULL,
        saved_amount          NUMERIC(12,2)  NOT NULL DEFAULT 0,
        tier                  VARCHAR(20)    NOT NULL,
        points                INTEGER        NOT NULL DEFAULT 0,
        is_completed          BOOLEAN        DEFAULT FALSE,
        achieved_at           TIMESTAMPTZ,
        achievement_photo_url TEXT,
        created_at            TIMESTAMPTZ    DEFAULT NOW(),
        UNIQUE(user_id, month)
      )
    `);

    return NextResponse.json({ success: true, message: 'savings_challenges table ready!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
