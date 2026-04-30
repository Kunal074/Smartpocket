import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET all expenses for the current user (Combined personal + group splits)
const getHandler = async (request, user) => {
  try {
    const result = await query(
      `SELECT 
        id, 
        amount, 
        category_id as "categoryId", 
        date, 
        note, 
        created_at,
        'personal' as type,
        NULL as with_user,
        NULL as "groupId",
        user_id as paid_by
      FROM expenses 
      WHERE user_id = $1

      UNION ALL

      SELECT 
        ge.id, 
        es.amount, 
        ge.category as "categoryId", 
        ge.date, 
        ge.title as note, 
        ge.created_at,
        CASE WHEN ge.group_id IS NULL THEN 'direct' ELSE 'group' END as type,
        CASE WHEN ge.group_id IS NULL AND ge.paid_by != $1 THEN payer.name ELSE NULL END as with_user,
        ge.group_id as "groupId",
        ge.paid_by
      FROM expense_splits es
      JOIN group_expenses ge ON es.expense_id = ge.id
      LEFT JOIN users payer ON ge.paid_by = payer.id
      WHERE es.user_id = $1

      UNION ALL

      SELECT 
        ge.id, 
        es.amount, 
        ge.category as "categoryId", 
        ge.date, 
        ge.title as note, 
        ge.created_at,
        'direct' as type,
        ower.name as with_user,
        ge.group_id as "groupId",
        ge.paid_by
      FROM expense_splits es
      JOIN group_expenses ge ON es.expense_id = ge.id
      LEFT JOIN users ower ON es.user_id = ower.id
      WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1

      ORDER BY date DESC, created_at DESC
      LIMIT 100`,
      [user.id]
    );

    // Convert date string to ISO format for frontend consistency
    const expenses = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), // Return YYYY-MM-DD
    }));

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error('Fetch Expenses Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST a new expense for the current user (Personal)
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
      type: 'personal'
    };

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Create Expense Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
