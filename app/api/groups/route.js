import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/groups
// List all groups the current user belongs to
export const GET = withAuth(async (request, user) => {
  try {
    const result = await query(`
      SELECT 
        g.id, g.name, g.type, g.description, g.icon, g.color, g.currency, g.is_archived, g.created_at,
        gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `, [user.id]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
});

// POST /api/groups
// Create a new group and add the creator as an admin member
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { name, type = 'custom', description = '', icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Start a transaction since we are inserting into two tables
    const client = await query('BEGIN');
    
    try {
      // 1. Create the group
      const groupResult = await query(`
        INSERT INTO groups (name, type, description, icon, color, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, type, description, icon, color, user.id]);
      
      const newGroup = groupResult.rows[0];

      // 2. Add the creator as an admin member
      await query(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES ($1, $2, 'admin')
      `, [newGroup.id, user.id]);

      await query('COMMIT');

      // Return group with member count of 1
      return NextResponse.json({ ...newGroup, member_count: 1, role: 'admin' }, { status: 201 });
      
    } catch (txError) {
      await query('ROLLBACK');
      throw txError;
    }
    
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
});
