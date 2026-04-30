import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Check if recurring_expenses table exists
    const tableCheck = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'recurring_expenses'
    `);
    
    // Also check users.id type
    const usersIdType = await query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);

    return NextResponse.json({ 
      recurring_table_exists: tableCheck.rowCount > 0,
      users_id_type: usersIdType.rows[0] || null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
