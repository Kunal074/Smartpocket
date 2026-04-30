import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/budgets
// Get the user's category budgets for the current month
const getHandler = async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    let month = searchParams.get('month');
    
    // Default to current month YYYY-MM
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const result = await query(
      `SELECT category_id as category, limit_amount as amount FROM budgets WHERE user_id = $1 AND month = $2`,
      [user.id, month]
    );

    // Convert array to object { food: 5000, transport: 2000, ... }
    const budgets = {};
    result.rows.forEach(row => {
      budgets[row.category] = parseFloat(row.amount);
    });

    return NextResponse.json({ budgets, month }, { status: 200 });
  } catch (error) {
    console.error('Fetch Budgets Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/budgets
// Set or update a budget for a specific category
const postHandler = async (request, user) => {
  try {
    const body = await request.json();
    const { category, amount, month } = body;

    if (!category || amount === undefined) {
      return NextResponse.json({ error: 'Missing category or amount' }, { status: 400 });
    }

    // Default to current month YYYY-MM
    let targetMonth = month;
    if (!targetMonth) {
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, limit_amount, month) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, month) 
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount
       RETURNING category_id as category, limit_amount as amount, month`,
      [user.id, category, amount, targetMonth]
    );

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Set Budget Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
