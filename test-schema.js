const { query } = require('./lib/db');

async function test() {
  try {
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));

    // Get group_expenses columns
    const ge = await query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'group_expenses'
    `);
    console.log('\ngroup_expenses schema:', ge.rows);

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
}
test();
