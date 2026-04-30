import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/savings — Get all savings goals
const getHandler = async (request, user) => {
  try {
    const result = await query(
      `SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY is_completed ASC, created_at DESC`,
      [user.id]
    );
    return NextResponse.json({ goals: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Get Savings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// POST /api/savings — Create a new savings goal
const postHandler = async (request, user) => {
  try {
    const { name, target_amount, target_date, icon, color } = await request.json();

    if (!name || !target_amount) {
      return NextResponse.json({ error: 'Name and target amount are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO savings_goals (user_id, name, target_amount, target_date, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.id, name, parseFloat(target_amount), target_date || null, icon || '🎯', color || '#5A67D8']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create Savings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
