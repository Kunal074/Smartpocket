import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// POST /api/arena/celebrate — Upload achievement photo to Cloudinary & mark on leaderboard
export const POST = withAuth(async (request, user) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const month = new Date().toISOString().slice(0, 7);

    // Check if user has completed their challenge
    const existing = await query(
      `SELECT * FROM savings_challenges WHERE user_id = $1 AND month = $2`,
      [user.id, month]
    );

    if (existing.rowCount === 0 || !existing.rows[0].is_completed) {
      return NextResponse.json({ error: 'You have not completed your challenge yet!' }, { status: 403 });
    }

    // Upload to Cloudinary using signed upload (server-side)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create signature
    const crypto = await import('crypto');
    const signString = `folder=arena_achievements&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha256').update(signString).digest('hex');

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', imageBase64);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'arena_achievements');

    const cloudRes = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!cloudRes.ok) {
      const err = await cloudRes.json();
      console.error('Cloudinary Error:', err);
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const cloudData = await cloudRes.json();
    const photoUrl = cloudData.secure_url;

    // Save photo URL to DB
    await query(
      `UPDATE savings_challenges SET achievement_photo_url = $1 WHERE user_id = $2 AND month = $3`,
      [photoUrl, user.id, month]
    );

    return NextResponse.json({ success: true, photo_url: photoUrl }, { status: 200 });
  } catch (error) {
    console.error('Celebrate Error:', error);
    return NextResponse.json({ error: 'Failed to upload celebration photo' }, { status: 500 });
  }
});
