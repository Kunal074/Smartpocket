import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/recurring — list all active recurring expenses for user
const getHandler = async (request, user) => {
  try {
    const result = await query(
      `SELECT id, category_id, amount, note, frequency, next_date, is_active, created_at
       FROM recurring_expenses
       WHERE user_id = $1
       ORDER BY next_date ASC`,
      [user.id]
    );
    return NextResponse.json({ recurring: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Get Recurring Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/recurring — create a new recurring expense
const postHandler = async (request, user) => {
  try {
    const { category_id, amount, note, frequency, start_date } = await request.json();

    if (!amount || !note) {
      return NextResponse.json({ error: 'amount and note are required' }, { status: 400 });
    }

    const freq = frequency || 'monthly';
    const nextDate = start_date || new Date().toISOString().slice(0, 10);

    const result = await query(
      `INSERT INTO recurring_expenses (user_id, category_id, amount, note, frequency, next_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.id, category_id || 'other', parseFloat(amount), note, freq, nextDate]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create Recurring Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
