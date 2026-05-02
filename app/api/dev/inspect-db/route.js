import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // List all public tables
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(r => r.table_name);

    // Get row count for each table
    const counts = {};
    for (const table of tables) {
      try {
        const countResult = await query(`SELECT COUNT(*) FROM "${table}"`);
        counts[table] = parseInt(countResult.rows[0].count);
      } catch {
        counts[table] = 'error';
      }
    }

    return NextResponse.json({
      total_tables: tables.length,
      tables: counts,
      status: tables.length >= 10 ? '✅ All tables ready!' : '⚠️ Some tables may be missing'
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
