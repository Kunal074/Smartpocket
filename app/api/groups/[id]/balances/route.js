import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
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
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
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

    // --- Calculate Raw (Unsimplified) Debts ---
    const rawMap = {}; // debtor_id -> creditor_id -> amount
    const rawExpenses = await query(`
      SELECT ge.paid_by as creditor, es.user_id as debtor, SUM(es.amount) as amount
      FROM group_expenses ge
      JOIN expense_splits es ON ge.id = es.expense_id
      WHERE ge.group_id = $1 AND ge.paid_by != es.user_id
      GROUP BY ge.paid_by, es.user_id
    `, [groupId]);

    rawExpenses.rows.forEach(r => {
      if (!rawMap[r.debtor]) rawMap[r.debtor] = {};
      rawMap[r.debtor][r.creditor] = (rawMap[r.debtor][r.creditor] || 0) + parseFloat(r.amount);
    });

    const rawSettlements = await query(`
      SELECT paid_to as creditor, paid_by as debtor, SUM(amount) as amount
      FROM settlements
      WHERE group_id = $1 AND status = 'completed'
      GROUP BY paid_to, paid_by
    `, [groupId]);

    rawSettlements.rows.forEach(r => {
      if (!rawMap[r.debtor]) rawMap[r.debtor] = {};
      rawMap[r.debtor][r.creditor] = (rawMap[r.debtor][r.creditor] || 0) - parseFloat(r.amount);
    });

    const rawDebts = [];
    Object.keys(rawMap).forEach(debtor => {
      Object.keys(rawMap[debtor]).forEach(creditor => {
        let net = rawMap[debtor][creditor];
        if (rawMap[creditor] && rawMap[creditor][debtor]) {
          net -= rawMap[creditor][debtor];
          rawMap[creditor][debtor] = 0; // Prevent double processing
        }
        
        if (net > 0.01) {
          rawDebts.push({
            from: userMap[debtor],
            to: userMap[creditor],
            amount: parseFloat(net.toFixed(2))
          });
        } else if (net < -0.01) {
          rawDebts.push({
            from: userMap[creditor],
            to: userMap[debtor],
            amount: parseFloat(Math.abs(net).toFixed(2))
          });
        }
      });
    });

    return NextResponse.json({
      netBalances,
      simplifiedDebts: enrichedTransactions,
      rawDebts
    });

  } catch (error) {
    console.error('Error calculating balances:', error);
    return NextResponse.json({ error: 'Failed to calculate balances' }, { status: 500 });
  }
});
