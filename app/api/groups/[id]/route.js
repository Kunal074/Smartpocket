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

// GET /api/groups/[id]
// Get group details and its members
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
    const membership = await checkMembership(groupId, user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Not authorized or group not found' }, { status: 403 });
    }

    // Get group info
    const groupResult = await query('SELECT * FROM groups WHERE id = $1', [groupId]);
    const group = groupResult.rows[0];

    // Get members
    const membersResult = await query(`
      SELECT gm.id as membership_id, gm.role, gm.joined_at, u.id as user_id, u.name, u.email, u.upi_id
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [groupId]);

    return NextResponse.json({
      ...group,
      members: membersResult.rows,
      myRole: membership.role
    });

  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
});

// PUT /api/groups/[id]
// Update group details (only admin can update)
export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
    const membership = await checkMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update the group' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, description, icon, color } = body;

    const result = await query(`
      UPDATE groups 
      SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        color = COALESCE($5, color)
      WHERE id = $6
      RETURNING *
    `, [name, type, description, icon, color, groupId]);

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
});

// DELETE /api/groups/[id]
// Archive/Delete group (only admin can delete)
export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
    const membership = await checkMembership(groupId, user.id);
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete the group' }, { status: 403 });
    }

    // Instead of hard delete, we set is_archived = true
    await query('UPDATE groups SET is_archived = true WHERE id = $1', [groupId]);

    return NextResponse.json({ success: true, message: 'Group archived successfully' });

  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
});
