import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// POST /api/groups/[id]/settlements
// Record a manual settlement between two members
export const POST = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;

    // Check membership
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { paid_by, paid_to, amount } = await request.json();

    if (!paid_by || !paid_to || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure settlements table exists
    await query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        paid_by UUID REFERENCES users(id),
        paid_to UUID REFERENCES users(id),
        amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Insert settlement
    const result = await query(`
      INSERT INTO settlements (group_id, paid_by, paid_to, amount, status)
      VALUES ($1, $2, $3, $4, 'completed')
      RETURNING *
    `, [groupId, paid_by, paid_to, parseFloat(amount)]);

    // Get payer and receiver names for the chat message
    const namesRes = await query(
      'SELECT id, name FROM users WHERE id = ANY($1)',
      [[paid_by, paid_to]]
    );
    const namesMap = {};
    namesRes.rows.forEach(u => namesMap[u.id] = u.name);

    // Post notification to group chat
    const msg = `✅ ${namesMap[paid_by] || 'Someone'} settled ₹${parseFloat(amount).toFixed(0)} with ${namesMap[paid_to] || 'someone'}.`;
    await query(`
      INSERT INTO group_messages (group_id, sender_id, message)
      VALUES ($1, $2, $3)
    `, [groupId, user.id, msg]);

    return NextResponse.json({ success: true, settlement: result.rows[0] }, { status: 201 });

  } catch (error) {
    console.error('Error recording settlement:', error);
    return NextResponse.json({ error: 'Failed to record settlement' }, { status: 500 });
  }
});

// GET /api/groups/[id]/settlements
// List all settlements for a group
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;

    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        paid_by UUID REFERENCES users(id),
        paid_to UUID REFERENCES users(id),
        amount NUMERIC(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const result = await query(`
      SELECT 
        s.*,
        pb.name as paid_by_name,
        pt.name as paid_to_name
      FROM settlements s
      JOIN users pb ON s.paid_by = pb.id
      JOIN users pt ON s.paid_to = pt.id
      WHERE s.group_id = $1
      ORDER BY s.created_at DESC
    `, [groupId]);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
});
