import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/groups/[id]/history
export const GET = withAuth(async (request, user, { params }) => {
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

    // Ensure table exists so we don't crash if no edits have been made yet
    await query(`
      CREATE TABLE IF NOT EXISTS expense_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        changes_summary TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Fetch history
    const historyResult = await query(`
      SELECT 
        eh.id as history_id,
        eh.action_type,
        eh.changes_summary,
        eh.created_at as edit_time,
        u.name as user_name,
        ge.*,
        ge.id as id, 
        ge.title as expense_title,
        ge.note as expense_note
      FROM expense_history eh
      JOIN users u ON eh.user_id = u.id
      JOIN group_expenses ge ON eh.expense_id = ge.id
      WHERE ge.group_id = $1
      ORDER BY eh.created_at DESC
      LIMIT 100
    `, [groupId]);

    return NextResponse.json({ history: historyResult.rows });

  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
});
