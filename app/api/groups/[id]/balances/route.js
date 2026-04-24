import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { simplifyDebts } from '@/lib/debtSimplifier';

// Helper to check if user is a member of the group
async function checkMembership(groupId, userId) {
  const result = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  return result.rows[0] || null;
}

// GET /api/groups/[id]/balances
// Compute the net balance of each user and return simplified settlement transactions
export const GET = withAuth(async (request, { user, params }) => {
  try {
    const groupId = params.id;
    
    const membership = await checkMembership(groupId, user.id);
    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 1. Get all members to ensure everyone is included even if balance is 0
    const membersResult = await query(`
      SELECT u.id, u.name, u.upi_id, u.email
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
    `, [groupId]);
    
    const members = membersResult.rows;
    const balances = {}; // { user_id: net_balance }
    const userMap = {};  // { user_id: { name, upi_id, ... } }
    
    members.forEach(m => {
      balances[m.id] = 0;
      userMap[m.id] = m;
    });

    // 2. Add credits (what people paid for expenses)
    const expenseCredits = await query(`
      SELECT paid_by, SUM(amount) as total
      FROM group_expenses
      WHERE group_id = $1
      GROUP BY paid_by
    `, [groupId]);
    
    expenseCredits.rows.forEach(row => {
      if (balances[row.paid_by] !== undefined) {
        balances[row.paid_by] += parseFloat(row.total);
      }
    });

    // 3. Subtract debits (what people owe for expenses based on their splits)
    const expenseDebits = await query(`
      SELECT es.user_id, SUM(es.amount) as total
      FROM expense_splits es
      JOIN group_expenses ge ON es.expense_id = ge.id
      WHERE ge.group_id = $1
      GROUP BY es.user_id
    `, [groupId]);
    
    expenseDebits.rows.forEach(row => {
      if (balances[row.user_id] !== undefined) {
        balances[row.user_id] -= parseFloat(row.total);
      }
    });

    // 4. Add settlement credits (what people paid in settlements to others)
    const settlementCredits = await query(`
      SELECT paid_by, SUM(amount) as total
      FROM settlements
      WHERE group_id = $1 AND status = 'completed'
      GROUP BY paid_by
    `, [groupId]);
    
    settlementCredits.rows.forEach(row => {
      if (balances[row.paid_by] !== undefined) {
        balances[row.paid_by] += parseFloat(row.total);
      }
    });

    // 5. Subtract settlement debits (what people received in settlements from others)
    const settlementDebits = await query(`
      SELECT paid_to, SUM(amount) as total
      FROM settlements
      WHERE group_id = $1 AND status = 'completed'
      GROUP BY paid_to
    `, [groupId]);
    
    settlementDebits.rows.forEach(row => {
      if (balances[row.paid_to] !== undefined) {
        balances[row.paid_to] -= parseFloat(row.total);
      }
    });

    // 6. Simplify debts using Minimum Cash Flow algorithm
    const simplifiedTransactions = simplifyDebts(balances);

    // 7. Map the user IDs back to rich user objects for the frontend
    const enrichedTransactions = simplifiedTransactions.map(t => ({
      from: userMap[t.from],
      to: userMap[t.to],
      amount: t.amount
    }));

    // Return the individual net balances as well as the simplified transactions
    const netBalances = Object.keys(balances).map(id => ({
      user: userMap[id],
      balance: parseFloat(balances[id].toFixed(2))
    }));

    return NextResponse.json({
      netBalances,
      simplifiedDebts: enrichedTransactions
    });

  } catch (error) {
    console.error('Error calculating balances:', error);
    return NextResponse.json({ error: 'Failed to calculate balances' }, { status: 500 });
  }
});
