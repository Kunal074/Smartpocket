import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/users/me
// Returns the current user's profile
const getProfile = async (request, user) => {
  try {
    const result = await query(
      'SELECT id, name, email, upi_id, phone, created_at FROM users WHERE id = $1',
      [user.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
};

// PUT /api/users/me
// Update user profile (name, upi_id, phone)
const updateProfile = async (request, user) => {
  try {
    const body = await request.json();
    const { name, upi_id, phone } = body;

    const result = await query(`
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        upi_id = COALESCE($2, upi_id),
        phone = COALESCE($3, phone),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, email, upi_id, phone
    `, [name || null, upi_id || null, phone || null, user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
};

export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
