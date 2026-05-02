import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, upi_id = '', otp } = body;

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required for verification' }, { status: 400 });
    }

    // Verify OTP
    const otpResult = await query(
      'SELECT * FROM email_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (otpResult.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid or expired OTP. Please try again.' }, { status: 400 });
    }

    // Delete used OTP
    await query('DELETE FROM email_otps WHERE email = $1', [email]);

    // Ensure phone and upi_id columns exist
    try {
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    } catch (e) { /* ignore */ }
    try {
      await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100)');
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
      'INSERT INTO users (name, email, phone, upi_id, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, upi_id',
      [name, email, phone, upi_id || null, password_hash]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

