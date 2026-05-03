import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/dev/migrate-savings
// Fixes savings_goals table if it was created with old schema (title/deadline columns)
export async function GET() {
  const results = [];
  
  try {
    // Add 'name' column if missing (old schema used 'title')
    await query(`ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS name TEXT`)
      .then(() => results.push('✅ name column ensured'))
      .catch(e => results.push(`⚠️ name: ${e.message}`));

    // Copy title → name if name is empty
    await query(`UPDATE savings_goals SET name = title WHERE name IS NULL OR name = ''`)
      .then(r => results.push(`✅ Migrated ${r.rowCount} rows from title to name`))
      .catch(e => results.push(`⚠️ title→name copy: ${e.message}`));

    // Add 'target_date' column if missing (old schema used 'deadline')
    await query(`ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS target_date DATE`)
      .then(() => results.push('✅ target_date column ensured'))
      .catch(e => results.push(`⚠️ target_date: ${e.message}`));

    // Copy deadline → target_date if missing
    await query(`UPDATE savings_goals SET target_date = deadline WHERE target_date IS NULL AND deadline IS NOT NULL`)
      .then(r => results.push(`✅ Migrated ${r.rowCount} rows from deadline to target_date`))
      .catch(e => results.push(`⚠️ deadline→target_date: ${e.message}`));

    // Add 'is_completed' column if missing
    await query(`ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE`)
      .then(() => results.push('✅ is_completed column ensured'))
      .catch(e => results.push(`⚠️ is_completed: ${e.message}`));

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }
}
