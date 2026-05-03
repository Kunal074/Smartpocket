import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

const CURRENT_MONTH = () => new Date().toISOString().slice(0, 7);

// GET /api/arena/leaderboard?filter=global|friends
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'global'; // 'global' or 'friends'
    const month = CURRENT_MONTH();

    // Get user's tier first
    const myChallenge = await query(
      `SELECT tier FROM savings_challenges WHERE user_id = $1 AND month = $2`,
      [user.id, month]
    );

    if (myChallenge.rowCount === 0) {
      return NextResponse.json({ leaderboard: [], myRank: null, tier: null }, { status: 200 });
    }

    const tier = myChallenge.rows[0].tier;

    let leaderboard;
    if (filter === 'friends') {
      // Get friends list + self
      leaderboard = await query(
        `SELECT 
          sc.user_id, u.name, sc.saved_amount, sc.target_amount, sc.points, sc.tier,
          sc.is_completed, sc.achievement_photo_url, sc.goal_name,
          ROUND((sc.saved_amount / sc.target_amount) * 100, 1) AS pct,
          RANK() OVER (ORDER BY sc.points DESC) AS rank
         FROM savings_challenges sc
         JOIN users u ON u.id = sc.user_id
         WHERE sc.month = $1
           AND sc.tier = $2
           AND (
             sc.user_id = $3
             OR sc.user_id IN (
               SELECT friend_id FROM friends WHERE user_id = $3
               UNION
               SELECT user_id FROM friends WHERE friend_id = $3
             )
           )
         ORDER BY sc.points DESC
         LIMIT 50`,
        [month, tier, user.id]
      );
    } else {
      // Global leaderboard within same tier
      leaderboard = await query(
        `SELECT 
          sc.user_id, u.name, sc.saved_amount, sc.target_amount, sc.points, sc.tier,
          sc.is_completed, sc.achievement_photo_url, sc.goal_name,
          ROUND((sc.saved_amount / sc.target_amount) * 100, 1) AS pct,
          RANK() OVER (ORDER BY sc.points DESC) AS rank
         FROM savings_challenges sc
         JOIN users u ON u.id = sc.user_id
         WHERE sc.month = $1 AND sc.tier = $2
         ORDER BY sc.points DESC
         LIMIT 50`,
        [month, tier]
      );
    }

    // Find user's rank
    const myEntry = leaderboard.rows.find(r => r.user_id === user.id);

    return NextResponse.json({
      leaderboard: leaderboard.rows,
      myRank: myEntry ? parseInt(myEntry.rank) : null,
      tier,
      month,
    }, { status: 200 });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
});
