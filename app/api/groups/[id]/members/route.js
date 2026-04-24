import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

// Helper to check if user is admin
async function checkAdmin(groupId, userId) {
  const result = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return result.rows[0]?.role === 'admin';
}

// POST /api/groups/[id]/members
// Add a member by email (only admins can add)
export const POST = withAuth(async (request, user, { params }) => {
  try {
    const groupId = params.id;
    
    const isAdmin = await checkAdmin(groupId, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    const { email, role = 'member' } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }
    const targetUserId = userResult.rows[0].id;

    // Check if already a member
    const existingResult = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );
    if (existingResult.rowCount > 0) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add to group
    await query(`
      INSERT INTO group_members (group_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [groupId, targetUserId, role]);

    return NextResponse.json({ success: true, message: 'Member added successfully' }, { status: 201 });

  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
});

// DELETE /api/groups/[id]/members?userId=xxx
// Remove a member (only admins can remove, or user can remove themselves)
export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const groupId = params.id;
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target userId is required' }, { status: 400 });
    }

    const isAdmin = await checkAdmin(groupId, user.id);
    
    // Can only remove if you are an admin OR you are leaving the group yourself
    if (!isAdmin && user.id !== targetUserId) {
      return NextResponse.json({ error: 'Not authorized to remove this member' }, { status: 403 });
    }

    // Remove from group
    await query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    return NextResponse.json({ success: true, message: 'Member removed successfully' });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
});
