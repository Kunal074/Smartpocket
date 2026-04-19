import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET all budgets for the current user
const getHandler = async (request, user) => {
  try {
    const result = await query(
      'SELECT id, category_id as "categoryId", month, limit_amount as limit, created_at FROM budgets WHERE user_id = $1',
      [user.id]
    );

    const budgets = result.rows.map(row => ({
      ...row,
      limit: parseFloat(row.limit),
    }));

    return NextResponse.json({ budgets }, { status: 200 });
  } catch (error) {
    console.error('Fetch Budgets Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST to create or update a budget
const postHandler = async (request, user) => {
  try {
    const body = await request.json();
    const { categoryId, month, limit } = body;

    if (!categoryId || !month || limit === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Using ON CONFLICT to act as an UPSERT
    const result = await query(
      `INSERT INTO budgets (user_id, category_id, month, limit_amount) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, month) 
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount
       RETURNING id, category_id as "categoryId", month, limit_amount as limit, created_at`,
      [user.id, categoryId, month, limit]
    );

    const budget = {
      ...result.rows[0],
      limit: parseFloat(result.rows[0].limit),
    };

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error('Upsert Budget Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
