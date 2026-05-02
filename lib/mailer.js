import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (not your normal password)
  },
});

/**
 * Send an OTP email for verification
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} name - Recipient's name
 */
export async function sendOTPEmail(to, otp, name) {
  const mailOptions = {
    from: `"SmartPocket" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} is your SmartPocket verification code`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #F4F8FB; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5A67D8 0%, #7C3AED 100%); padding: 40px 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">💰</span>
          </div>
          <h1 style="color: white; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SmartPocket</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Smart Expense Tracking</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 40px 32px;">
          <h2 style="color: #1E2340; font-size: 22px; font-weight: 700; margin: 0 0 8px;">Hey ${name}! 👋</h2>
          <p style="color: #718096; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
            Thanks for signing up for SmartPocket! Use the OTP below to verify your email address.
          </p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%); border: 2px dashed #5A67D8; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 32px;">
            <p style="color: #5A67D8; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px;">Your Verification Code</p>
            <div style="font-size: 48px; font-weight: 800; color: #1E2340; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</div>
            <p style="color: #A0AEC0; font-size: 13px; margin: 12px 0 0;">This code expires in <strong>10 minutes</strong></p>
          </div>

          <div style="background: #FFF5F5; border-left: 4px solid #FC8181; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #C53030; font-size: 13px; margin: 0; font-weight: 600;">
              ⚠️ Never share this OTP with anyone. SmartPocket will never ask for it.
            </p>
          </div>

          <p style="color: #A0AEC0; font-size: 13px; line-height: 1.6; margin: 0;">
            If you didn't create a SmartPocket account, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #F4F8FB; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
          <p style="color: #A0AEC0; font-size: 12px; margin: 0;">© 2025 SmartPocket · All rights reserved</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
