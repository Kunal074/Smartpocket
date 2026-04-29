import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Ensure messages table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS group_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id, created_at DESC)`);
}

// GET /api/group-messages/[groupId] — fetch messages
export const GET = withAuth(async (request, user, { params }) => {
  try {
    await ensureTable();
    const { groupId } = await params;

    // Verify user is a member
    const memberCheck = await query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        gm.id,
        gm.message,
        gm.created_at,
        u.id as sender_id,
        u.name as sender_name
      FROM group_messages gm
      JOIN users u ON gm.sender_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.created_at ASC
      LIMIT 200
    `, [groupId]);

    return NextResponse.json({ messages: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
});

// POST /api/group-messages/[groupId] — send a message
export const POST = withAuth(async (request, user, { params }) => {
  try {
    await ensureTable();
    const { groupId } = await params;
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Verify member
    const memberCheck = await query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const result = await query(`
      INSERT INTO group_messages (group_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, message, created_at, sender_id
    `, [groupId, user.id, message.trim()]);

    const msg = result.rows[0];
    return NextResponse.json({
      message: {
        ...msg,
        sender_name: user.name,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
});
