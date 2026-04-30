import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// POST /api/recurring/process
// Called on app open — finds all due recurring expenses and logs them as real expenses
const postHandler = async (request, user) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Find all active recurring expenses that are due today or overdue
    const due = await query(
      `SELECT * FROM recurring_expenses
       WHERE user_id = $1 AND is_active = TRUE AND next_date <= $2`,
      [user.id, today]
    );

    if (due.rowCount === 0) {
      return NextResponse.json({ logged: 0 }, { status: 200 });
    }

    let logged = 0;
    for (const rec of due.rows) {
      // Insert as a real personal expense
      await query(
        `INSERT INTO expenses (user_id, category_id, amount, note, date)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, rec.category_id, rec.amount, `[Auto] ${rec.note}`, today]
      );

      // Calculate the next due date
      let nextDate = new Date(rec.next_date);
      if (rec.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

      await query(
        `UPDATE recurring_expenses SET next_date = $1 WHERE id = $2`,
        [nextDate.toISOString().slice(0, 10), rec.id]
      );

      logged++;
    }

    return NextResponse.json({ logged, message: `${logged} recurring expense(s) auto-logged!` }, { status: 200 });
  } catch (error) {
    console.error('Process Recurring Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST = withAuth(postHandler);
