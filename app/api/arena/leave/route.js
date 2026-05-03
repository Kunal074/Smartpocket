import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// DELETE /api/arena/leave — Leave this month's challenge
export const DELETE = withAuth(async (request, user) => {
  try {
    const month = new Date().toISOString().slice(0, 7);

    const result = await query(
      `DELETE FROM savings_challenges WHERE user_id = $1 AND month = $2 RETURNING id`,
      [user.id, month]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'No active challenge found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Leave Arena Error:', error);
    return NextResponse.json({ error: 'Failed to leave challenge' }, { status: 500 });
  }
});
