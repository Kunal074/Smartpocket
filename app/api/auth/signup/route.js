import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure phone column exists
    try {
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE');
    } catch (e) { /* ignore */ }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: 'Email or Phone already registered' }, { status: 409 });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
      [name, email, phone, password_hash]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
