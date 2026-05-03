import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7); // "2026-05"

const getTier = (amount) => {
  if (amount <= 5000)    return 'bronze';
  if (amount <= 20000)   return 'silver';
  if (amount <= 100000)  return 'gold';
  return 'platinum';
};

const calcPoints = (saved, target) => {
  const pct = saved / target;
  const base = Math.min(pct * 1000, 1000);
  const goalBonus = saved >= target ? 500 : 0;
  const overBonus = saved > target ? Math.floor(((pct - 1) / 0.1)) * 100 : 0;
  return Math.round(base + goalBonus + overBonus);
};

// POST /api/arena/join — Join this month's challenge
export const POST = withAuth(async (request, user) => {
  try {
    const { target_amount, goal_name } = await request.json();
    if (!target_amount || isNaN(target_amount) || parseFloat(target_amount) <= 0) {
      return NextResponse.json({ error: 'Invalid target amount' }, { status: 400 });
    }

    const month = CURRENT_MONTH();
    const tier = getTier(parseFloat(target_amount));

    // If a custom goal_name is provided (no existing goal selected),
    // auto-create a savings goal so it shows up in the Savings screen
    if (goal_name && goal_name.trim()) {
      const existingGoal = await query(
        `SELECT id FROM savings_goals WHERE user_id = $1 AND name ILIKE $2 AND is_completed = false LIMIT 1`,
        [user.id, goal_name.trim()]
      );

      if (existingGoal.rowCount === 0) {
        await query(
          `INSERT INTO savings_goals (user_id, name, title, target_amount, icon, color)
           VALUES ($1, $2, $2, $3, '🎯', '#5A67D8')`,
          [user.id, goal_name.trim(), parseFloat(target_amount)]
        );
      }
    }

    const result = await query(
      `INSERT INTO savings_challenges (user_id, month, target_amount, tier, goal_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, month) DO UPDATE SET target_amount = $3, tier = $4, goal_name = $5, saved_amount = 0, points = 0, is_completed = false
       RETURNING *`,
      [user.id, month, parseFloat(target_amount), tier, goal_name?.trim() || null]
    );

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Arena Join Error:', error);
    return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 });
  }
});

// GET /api/arena/join — Get my current month challenge
export const GET = withAuth(async (request, user) => {
  try {
    const month = CURRENT_MONTH();
    const result = await query(
      `SELECT * FROM savings_challenges WHERE user_id = $1 AND month = $2`,
      [user.id, month]
    );
    return NextResponse.json(result.rows[0] || null, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get challenge' }, { status: 500 });
  }
});
