import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// PUT /api/users/me
// Update user profile (name and upi_id)
const updateProfile = async (request, user) => {
  try {
    const body = await request.json();
    const { name, upi_id } = body;

    if (!name && upi_id === undefined) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // Validate UPI ID format roughly if provided
    if (upi_id && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi_id)) {
      return NextResponse.json({ error: 'Invalid UPI ID format' }, { status: 400 });
    }

    const result = await query(`
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        upi_id = COALESCE($2, upi_id),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, upi_id
    `, [name, upi_id || null, user.id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
};

export const PUT = withAuth(updateProfile);
