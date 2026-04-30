import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/export?month=04&year=2026
const getHandler = async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    // Build date range
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    // Get last day of the month
    const endDate = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);

    // Fetch personal expenses
    const expensesRes = await query(
      `SELECT e.id, e.amount, e.note, e.date, e.category_id as category, 'expense' as type
       FROM expenses e
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3
       ORDER BY e.date DESC`,
      [user.id, startDate, endDate]
    );

    // Fetch smartsplit expenses (where user paid for others, or user's share in a group)
    // To keep it simple, let's just fetch the user's personal expenses and their share of group expenses
    const groupSharesRes = await query(
      `SELECT ge.id, (ge.amount / ge.split_among) as amount, ge.description as note, ge.date, 'group_share' as category, 'expense' as type
       FROM group_expenses ge
       JOIN group_members gm ON ge.group_id = gm.group_id
       WHERE gm.user_id = $1 AND ge.date >= $2 AND ge.date <= $3
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
