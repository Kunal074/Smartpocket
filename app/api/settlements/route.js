import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Helper to check if user is a member of the group
async function checkMembership(groupId, userId) {
  const result = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return result.rows[0] || null;
}

// GET /api/settlements?groupId=xxx  OR  ?userId=xxx  OR  (no params = all for current user)
export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const userId = url.searchParams.get('userId');

    if (groupId) {
      const membership = await checkMembership(groupId, user.id);
      if (!membership) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const result = await query(`
        SELECT 
          s.*, 
          payer.name as payer_name, 
          payee.name as payee_name,
          COALESCE(g.name, 'Direct') as group_name
        FROM settlements s
        JOIN users payer ON s.paid_by = payer.id
        JOIN users payee ON s.paid_to = payee.id
        LEFT JOIN groups g ON s.group_id = g.id
        WHERE s.group_id = $1
        ORDER BY s.created_at DESC
      `, [groupId]);

      return NextResponse.json(result.rows);
    }

    if (userId) {
      const result = await query(`
        SELECT 
          s.*, 
          payer.name as payer_name, 
          payee.name as payee_name,
          COALESCE(g.name, 'Direct') as group_name
        FROM settlements s
        JOIN users payer ON s.paid_by = payer.id
        JOIN users payee ON s.paid_to = payee.id
        LEFT JOIN groups g ON s.group_id = g.id
        WHERE (s.paid_by = $1 AND s.paid_to = $2) OR (s.paid_by = $2 AND s.paid_to = $1)
        ORDER BY s.created_at DESC
      `, [user.id, userId]);

      return NextResponse.json(result.rows);
    }

    // No params — return ALL settlements involving the current user
    const result = await query(`
      SELECT 
        s.*, 
        payer.name as payer_name, 
        payee.name as payee_name,
        COALESCE(g.name, 'Direct') as group_name
      FROM settlements s
      JOIN users payer ON s.paid_by = payer.id
      JOIN users payee ON s.paid_to = payee.id
      LEFT JOIN groups g ON s.group_id = g.id
      WHERE s.paid_by = $1 OR s.paid_to = $1
      ORDER BY s.created_at DESC
    `, [user.id]);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
});

// POST /api/settlements
// Record a new settlement
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { group_id, paid_to, amount, payment_method = 'upi', note = '' } = body;

    if (!group_id || !paid_to || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is in the group
    const membership = await checkMembership(group_id, user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify recipient is in the group
    const recipientMembership = await checkMembership(group_id, paid_to);
    if (!recipientMembership) {
      return NextResponse.json({ error: 'Recipient is not a member of this group' }, { status: 400 });
    }

    const result = await query(`
      INSERT INTO settlements (group_id, paid_by, paid_to, amount, payment_method, note, status, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
      RETURNING *
    `, [group_id, user.id, paid_to, amount, payment_method, note]);

    return NextResponse.json(result.rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json({ error: 'Failed to record settlement' }, { status: 500 });
  }
});
