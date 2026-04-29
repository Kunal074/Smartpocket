import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM expense_history');
    return NextResponse.json({ data: res.rows });
  } catch (e) {
    return NextResponse.json({ error: e.message });
  }
}
