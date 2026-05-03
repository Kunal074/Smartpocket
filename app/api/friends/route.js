import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Migration function to ensure schema is ready
const ensureMigration = async () => {
  try {
    await query(`ALTER TABLE group_expenses ALTER COLUMN group_id DROP NOT NULL;`);
  } catch (e) { /* ignore */ }

  await query(`
    CREATE TABLE IF NOT EXISTS friends (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, friend_id)
    );
  `);
};

// GET /api/friends
export const GET = withAuth(async (request, user) => {
  try {
    await ensureMigration();
    const result = await query(`
      SELECT 
        f.id as friend_record_id,
        u.id as user_id,
        u.name,
        u.email,
        u.phone
      FROM friends f
      JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = $1 OR f.friend_id = $1)
        AND u.id != $1
      ORDER BY u.name ASC
    `, [user.id]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
});

// POST /api/friends
// Body: { email } or { phone }
export const POST = withAuth(async (request, user) => {
  try {
    await ensureMigration();
    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone required' }, { status: 400 });
    }

    // Find the user to add
    let findQuery = '';
    let findValue = '';
    if (email) {
      findQuery = 'SELECT id, name FROM users WHERE email = $1';
      findValue = email;
    } else {
      findValue = phone.replace(/\D/g, '').slice(-10);
      if (!findValue || findValue.length < 10) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
      findQuery = `SELECT id, name FROM users WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE '%' || $1`;
    }

    const targetUser = await query(findQuery, [findValue]);

    if (targetUser.rowCount === 0) {
      return NextResponse.json({ error: 'User not found in SmartPocket' }, { status: 404 });
    }

    const friendId = targetUser.rows[0].id;

    if (friendId === user.id) {
      return NextResponse.json({ error: 'You cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if already friends
    const existingCheck = await query(`
      SELECT id FROM friends 
      WHERE (user_id = $1 AND friend_id = $2) 
         OR (user_id = $2 AND friend_id = $1)
    `, [user.id, friendId]);

    if (existingCheck.rowCount > 0) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Add friend record
    await query(`
      INSERT INTO friends (user_id, friend_id) 
      VALUES ($1, $2)
    `, [user.id, friendId]);

    return NextResponse.json({ success: true, message: 'Friend added successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 });
  }
});
