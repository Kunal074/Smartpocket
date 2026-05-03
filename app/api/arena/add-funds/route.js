import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7);

const calcPoints = (saved, target) => {
  const pct = saved / target;
  const base = Math.min(pct * 1000, 1000);
  const goalBonus = saved >= target ? 500 : 0;
  const overBonus = saved > target ? Math.floor(((pct - 1) / 0.1)) * 100 : 0;
  return Math.round(base + goalBonus + overBonus);
};

// POST /api/arena/add-funds — Add saved amount to this month's challenge
export const POST = withAuth(async (request, user) => {
  try {
    const { amount } = await request.json();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const month = CURRENT_MONTH();

    // Get current challenge
    const existing = await query(
      `SELECT * FROM savings_challenges WHERE user_id = $1 AND month = $2`,
      [user.id, month]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'You have not joined the monthly challenge yet!' }, { status: 404 });
    }

    const challenge = existing.rows[0];
    const newSaved = parseFloat(challenge.saved_amount) + parseFloat(amount);
    const newPoints = calcPoints(newSaved, parseFloat(challenge.target_amount));
    const isCompleted = newSaved >= parseFloat(challenge.target_amount);

    const result = await query(
      `UPDATE savings_challenges
       SET saved_amount = $1, points = $2, is_completed = $3, achieved_at = CASE WHEN $3 = true AND achieved_at IS NULL THEN NOW() ELSE achieved_at END
       WHERE user_id = $4 AND month = $5
       RETURNING *`,
      [newSaved, newPoints, isCompleted, user.id, month]
    );

    return NextResponse.json({
      ...result.rows[0],
      just_completed: isCompleted && !challenge.is_completed // true if just NOW completed
    }, { status: 200 });
  } catch (error) {
    console.error('Arena Add Funds Error:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
});
