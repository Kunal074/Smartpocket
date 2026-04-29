const { query } = require('./lib/db');

async function test() {
  try {
    const res = await query(`
      SELECT 
        id, 
        amount, 
        category_id as "categoryId", 
        date, 
        note, 
        created_at,
        'personal' as type
      FROM expenses 
      WHERE user_id = 1

      UNION ALL

      SELECT 
        ge.id, 
        es.amount, 
        ge.category as "categoryId", 
        ge.date, 
        ge.description as note, 
        ge.created_at,
        'group' as type
      FROM expense_splits es
      JOIN group_expenses ge ON es.expense_id = ge.id
      WHERE es.user_id = 1

      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `);
    console.log('SUCCESS:', res.rows.length);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
}
test();
