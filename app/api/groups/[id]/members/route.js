import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/groups/[id]/members
// Returns all members of the group
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;

    // Verify membership
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await query(`
      SELECT
        gm.user_id,
        gm.role,
        u.name,
        u.email,
        gm.joined_at
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [groupId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
});

// POST /api/groups/[id]/members
// Add a new member by email
export const POST = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;

    // Verify requester is admin
    const adminCheck = await query(
      "SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'admin'",
      [groupId, user.id]
    );
    if (adminCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
    }

    // Find user by email or phone
    let userResult;
    if (email) {
      userResult = await query('SELECT id, name, email FROM users WHERE email = $1', [email]);
      if (userResult.rowCount === 0) {
        return NextResponse.json({ error: 'No user found with that email' }, { status: 404 });
      }
    } else {
      // Strip all non-digits and take the last 10 digits to ignore country codes like +91
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      userResult = await query('SELECT id, name, email FROM users WHERE phone LIKE $1', [`%${cleanPhone}`]);
      if (userResult.rowCount === 0) {
        return NextResponse.json({ error: 'No user found with that phone number. Make sure they have a SmartPocket account.' }, { status: 404 });
      }
    }

    const newMember = userResult.rows[0];

    // Check if already a member
    const existingCheck = await query(
      'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, newMember.id]
    );
    if (existingCheck.rowCount > 0) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    await query(
      "INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'member')",
      [groupId, newMember.id]
    );

    return NextResponse.json({
      user_id: newMember.id,
      name: newMember.name,
      email: newMember.email,
      role: 'member',
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding group member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
});
