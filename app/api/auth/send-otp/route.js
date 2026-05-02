import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOTPEmail } from '@/lib/mailer';

// POST /api/auth/send-otp
// Step 1 of signup: Send OTP to user's email
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email already registered
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Ensure OTP table exists
    await query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Delete any existing OTPs for this email
    await query('DELETE FROM email_otps WHERE email = $1', [email]);

    // Store new OTP
    await query(
      'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp, name);

    return NextResponse.json({ message: 'OTP sent to your email' }, { status: 200 });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
