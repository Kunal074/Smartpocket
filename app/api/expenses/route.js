import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET all expenses for the current user
const getHandler = async (request, user) => {
  try {
    const result = await query(
      'SELECT id, amount, category_id as "categoryId", date, note, created_at FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [user.id]
    );

    // Convert date string to ISO format for frontend consistency
    const expenses = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      date: new Date(row.date).toISOString().slice(0, 10), // Return YYYY-MM-DD
    }));

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error('Fetch Expenses Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST a new expense for the current user
const postHandler = async (request, user) => {
  try {
    const body = await request.json();
    const { amount, categoryId, date, note } = body;

    if (!amount || !categoryId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO expenses (user_id, amount, category_id, date, note) VALUES ($1, $2, $3, $4, $5) RETURNING id, amount, category_id as "categoryId", date, note, created_at',
      [user.id, amount, categoryId, date, note || '']
    );

    const expense = {
      ...result.rows[0],
      amount: parseFloat(result.rows[0].amount),
      date: new Date(result.rows[0].date).toISOString().slice(0, 10),
    };

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Create Expense Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
