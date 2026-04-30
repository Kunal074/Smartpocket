import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/export?month=04&year=2026
const getHandler = async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      if (month && year) {
        startDate = `${year}-${month.padStart(2, '0')}-01`;
        endDate = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);
      } else {
        return NextResponse.json({ error: 'Date range (startDate & endDate) is required' }, { status: 400 });
      }
    }

    // Fetch personal expenses
    const expensesRes = await query(
      `SELECT e.id, e.amount, e.note, e.date, e.category_id as category, 'expense' as type
       FROM expenses e
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3
       ORDER BY e.date DESC`,
      [user.id, startDate, endDate]
    );

    const groupSharesRes = await query(
      `SELECT ge.id, es.amount as amount, ge.title as note, ge.date, 'group_share' as category, 'expense' as type
       FROM expense_splits es
       JOIN group_expenses ge ON es.expense_id = ge.id
       WHERE es.user_id = $1 AND ge.date >= $2 AND ge.date <= $3 AND es.amount > 0
       ORDER BY ge.date DESC`,
      [user.id, startDate, endDate]
    );

    const allData = [...expensesRes.rows, ...groupSharesRes.rows].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({
      month,
      year,
      total_records: allData.length,
      data: allData
    }, { status: 200 });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
