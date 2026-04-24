import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Wrap the handler with the withAuth middleware
const handler = async (request, user) => {
  try {
    // Fetch latest user details from DB to ensure they still exist
    const result = await query('SELECT id, name, email, upi_id FROM users WHERE id = $1', [user.id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = result.rows[0];
    return NextResponse.json({ user: userData }, { status: 200 });
  } catch (error) {
    console.error('Fetch Me Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(handler);
