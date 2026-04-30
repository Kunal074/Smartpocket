import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user by email
    const result = await query('SELECT id, name, email, phone, upi_id, password_hash FROM users WHERE email = $1', [email]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "No account found with this email. Please sign up first!" }, { status: 404 });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    // Remove password_hash from response
    delete user.password_hash;

    // Generate JWT
    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({ user, token }, { status: 200 });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
