import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// Ensure personal_bills table exists
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS personal_bills (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      category VARCHAR(50) DEFAULT 'other',
      note TEXT DEFAULT '',
      date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

// GET /api/analytics
// Returns spending breakdowns for the current user
export const GET = withAuth(async (request, user) => {
  try {
    await ensureTable();
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'month';
    const customStart = url.searchParams.get('startDate'); // YYYY-MM-DD
    const customEnd = url.searchParams.get('endDate');     // YYYY-MM-DD
    const isCustom = !!(customStart && customEnd);

    let interval = '1 month';
    if (timeframe === 'week') interval = '1 week';
    if (timeframe === 'year') interval = '1 year';

    // 1. Bar chart data (trends over time)
    let trendQuery = '';
    if (timeframe === 'week') {
      // Daily for the last 7 days
      trendQuery = `
        WITH combined AS (
          SELECT date, amount FROM expenses WHERE user_id = $1
          UNION ALL
          SELECT date, amount FROM personal_bills WHERE user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1
        )
        SELECT 
          TO_CHAR(date_trunc('day', date), 'Dy') as label,
          SUM(amount) as total
        FROM combined
        WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY date_trunc('day', date)
        ORDER BY date_trunc('day', date) ASC
      `;
    } else if (timeframe === 'month') {
      // Weekly for the last 4 weeks (or just monthly for 6 months as before)
      trendQuery = `
        WITH combined AS (
          SELECT date, amount FROM expenses WHERE user_id = $1
          UNION ALL
          SELECT date, amount FROM personal_bills WHERE user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1
        )
        SELECT 
          TO_CHAR(date_trunc('month', date), 'Mon') as label,
          SUM(amount) as total
        FROM combined
        WHERE date >= date_trunc('month', NOW()) - INTERVAL '5 months'
        GROUP BY date_trunc('month', date)
        ORDER BY date_trunc('month', date) ASC
      `;
    } else {
      // Monthly for the last 12 months
      trendQuery = `
        WITH combined AS (
          SELECT date, amount FROM expenses WHERE user_id = $1
          UNION ALL
          SELECT date, amount FROM personal_bills WHERE user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1
          UNION ALL
          SELECT ge.date, es.amount FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1
        )
        SELECT 
          TO_CHAR(date_trunc('month', date), 'Mon YYYY') as label,
          SUM(amount) as total
        FROM combined
        WHERE date >= date_trunc('year', NOW())
        GROUP BY date_trunc('month', date)
        ORDER BY date_trunc('month', date) ASC
      `;
    }

    const trendResult = await query(trendQuery, [user.id]);

    // 2. Spending by category (Unified)
    const catParams = isCustom ? [user.id, customStart, customEnd] : [user.id];
    const catDateFilter = isCustom
      ? `AND date >= $2 AND date <= $3`
      : `AND date >= NOW() - INTERVAL '${interval}'`;
    const categoryResult = await query(`
      WITH combined AS (
        SELECT category_id as category, amount, date FROM expenses WHERE user_id = $1
        UNION ALL
        SELECT category, amount, date FROM personal_bills WHERE user_id = $1
        UNION ALL
        SELECT category, es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1
        UNION ALL
        SELECT category, es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1
      )
      SELECT
        COALESCE(category, 'other') as category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM combined
      WHERE 1=1 ${catDateFilter}
      GROUP BY category
      ORDER BY total DESC
    `, catParams);

    // 3. Group spending total
    const grpDateFilter = isCustom
      ? `AND ge.date >= '${customStart}' AND ge.date <= '${customEnd}'`
      : `AND ge.date >= NOW() - INTERVAL '${interval}'`;
    const groupSpendResult = await query(`
      SELECT
        g.name as group_name,
        g.id as group_id,
        SUM(es.amount) as total
      FROM expense_splits es
      JOIN group_expenses ge ON es.expense_id = ge.id
      JOIN groups g ON ge.group_id = g.id
      WHERE es.user_id = $1
        ${grpDateFilter}
      GROUP BY g.id, g.name
      ORDER BY total DESC
      LIMIT 5
    `, [user.id]);

    // 4. Comparison vs previous period
    let comparisonResult;
    let compQuery = '';
    if (isCustom) {
      // For custom range: compare against an equal preceding period
      const startMs = new Date(customStart).getTime();
      const endMs = new Date(customEnd).getTime();
      const diffMs = endMs - startMs;
      const prevStart = new Date(startMs - diffMs - 86400000).toISOString().slice(0, 10);
      const prevEnd = new Date(startMs - 86400000).toISOString().slice(0, 10);
      comparisonResult = await query(`
        WITH combined AS (SELECT amount, date FROM expenses WHERE user_id = $1 UNION ALL SELECT amount, date FROM personal_bills WHERE user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1)
        SELECT
          SUM(CASE WHEN date >= $2 AND date <= $3 THEN amount ELSE 0 END) as current_period,
          SUM(CASE WHEN date >= $4 AND date <= $5 THEN amount ELSE 0 END) as prev_period
        FROM combined
      `, [user.id, customStart, customEnd, prevStart, prevEnd]);
    } else if (timeframe === 'week') {
      compQuery = `
        WITH combined AS (SELECT amount, date FROM expenses WHERE user_id = $1 UNION ALL SELECT amount, date FROM personal_bills WHERE user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1)
        SELECT
          SUM(CASE WHEN date >= NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as current_period,
          SUM(CASE WHEN date >= NOW() - INTERVAL '14 days' AND date < NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as prev_period
        FROM combined
      `;
    } else if (timeframe === 'month') {
      compQuery = `
        WITH combined AS (SELECT amount, date FROM expenses WHERE user_id = $1 UNION ALL SELECT amount, date FROM personal_bills WHERE user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1)
        SELECT
          SUM(CASE WHEN date >= date_trunc('month', NOW()) THEN amount ELSE 0 END) as current_period,
          SUM(CASE WHEN date >= date_trunc('month', NOW()) - INTERVAL '1 month' AND date < date_trunc('month', NOW()) THEN amount ELSE 0 END) as prev_period
        FROM combined
      `;
    } else {
      compQuery = `
        WITH combined AS (SELECT amount, date FROM expenses WHERE user_id = $1 UNION ALL SELECT amount, date FROM personal_bills WHERE user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE es.user_id = $1 UNION ALL SELECT es.amount, ge.date FROM expense_splits es JOIN group_expenses ge ON es.expense_id = ge.id WHERE ge.group_id IS NULL AND ge.paid_by = $1 AND es.user_id != $1)
        SELECT
          SUM(CASE WHEN date >= date_trunc('year', NOW()) THEN amount ELSE 0 END) as current_period,
          SUM(CASE WHEN date >= date_trunc('year', NOW()) - INTERVAL '1 year' AND date < date_trunc('year', NOW()) THEN amount ELSE 0 END) as prev_period
        FROM combined
      `;
    }

    if (!isCustom) comparisonResult = await query(compQuery, [user.id]);
    const comparison = comparisonResult.rows[0];
    const currentPeriod = parseFloat(comparison.current_period || 0);
    const prevPeriod = parseFloat(comparison.prev_period || 0);
    const changePercent = prevPeriod > 0
      ? Math.round(((currentPeriod - prevPeriod) / prevPeriod) * 100)
      : 0;

    // Fetch budgets for the current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetsResult = await query(
      `SELECT category_id as category, limit_amount as amount FROM budgets WHERE user_id = $1 AND month = $2`,
      [user.id, currentMonth]
    );
    const budgetsMap = {};
    budgetsResult.rows.forEach(r => budgetsMap[r.category] = parseFloat(r.amount));

    const byCategoryMap = {};
    categoryResult.rows.forEach(r => {
      byCategoryMap[r.category] = {
        category: r.category,
        total: parseFloat(r.total),
        count: parseInt(r.count),
        budget: budgetsMap[r.category] || null
      };
    });
    // Add categories with budgets but zero spending
    Object.keys(budgetsMap).forEach(cat => {
      if (!byCategoryMap[cat]) {
        byCategoryMap[cat] = {
          category: cat,
          total: 0,
          count: 0,
          budget: budgetsMap[cat]
        };
      }
    });
    const byCategoryFinal = Object.values(byCategoryMap).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      trends: trendResult.rows.map(r => ({
        label: r.label,
        total: parseFloat(r.total),
      })),
      byCategory: byCategoryFinal,
      byGroup: groupSpendResult.rows.map(r => ({
        groupId: r.group_id,
        groupName: r.group_name,
        total: parseFloat(r.total),
      })),
      comparison: {
        currentPeriod,
        prevPeriod,
        changePercent,
      },
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
});
