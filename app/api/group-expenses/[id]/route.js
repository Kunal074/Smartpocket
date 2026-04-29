import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { calculateSplits } from '@/lib/splitCalculator';

// Helper to get expense and check auth
async function ensureHistoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS expense_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      action_type VARCHAR(50) NOT NULL,
      changes_summary TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function getExpenseAndCheckAuth(expenseId, userId) {
  const expenseResult = await query('SELECT * FROM group_expenses WHERE id = $1', [expenseId]);
  const expense = expenseResult.rows[0];
  
  if (!expense) return null;

  // Direct expense (Udhaar) - no group, check if paid_by or split member
  if (!expense.group_id) {
    if (expense.paid_by === userId) return expense;
    const splitCheck = await query(
      'SELECT 1 FROM expense_splits WHERE expense_id = $1 AND user_id = $2',
      [expenseId, userId]
    );
    return splitCheck.rowCount > 0 ? expense : null;
  }

  // Group expense - check membership
  const memberCheck = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [expense.group_id, userId]
  );
  
  if (memberCheck.rowCount === 0) return null;
  
  return expense;
}

// PUT /api/group-expenses/[id]
// Edit an existing group expense
export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const { id: expenseId } = await params;
    
    const existingExpense = await getExpenseAndCheckAuth(expenseId, user.id);
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    let { 
      title, 
      amount, 
      category, 
      split_type, 
      note, 
      date,
      paid_by,
      members // New split members
    } = body;

    // Convert undefined to existing values or null for PG
    const pTitle = title !== undefined ? title : existingExpense.title;
    const pAmount = amount !== undefined ? amount : existingExpense.amount;
    const pCategory = category !== undefined ? category : existingExpense.category;
    const pSplitType = split_type !== undefined ? split_type : existingExpense.split_type;
    const pNote = note !== undefined ? note : existingExpense.note;
    const pDate = date !== undefined ? date : existingExpense.date;
    const pPaidBy = paid_by !== undefined ? paid_by : existingExpense.paid_by;

    // 1. Update the main expense record
    const updatedExpenseResult = await query(`
      UPDATE group_expenses
      SET 
        title = $1,
        amount = $2,
        category = $3,
        split_type = $4,
        note = $5,
        date = $6,
        paid_by = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [pTitle, pAmount, pCategory, pSplitType, pNote, pDate, pPaidBy, expenseId]);

    const updatedExpense = updatedExpenseResult.rows[0];

    // Fetch old splits for history diff BEFORE doing anything
    const oldSplitsResult = await query('SELECT user_id, amount, percentage FROM expense_splits WHERE expense_id = $1', [expenseId]);
    const oldSplits = oldSplitsResult.rows;

    // 2. Auto-calculate splits if amount changed but no members array is provided
    let finalMembers = members;
    if (amount !== undefined && existingExpense.amount != amount && (!members || members.length === 0)) {
      const existingSplits = oldSplitsResult;
      
      finalMembers = existingSplits.rows.map(s => ({
        user_id: s.user_id,
        amount: s.amount,
        percentage: s.percentage
      }));

      // For Udhaar (custom split with exactly 1 member), automatically set the split amount to the new total amount
      if (pSplitType === 'custom' && finalMembers.length === 1) {
        finalMembers[0].amount = parseFloat(amount);
      }
    }

    // 3. If splits/members are provided or auto-calculated, re-calculate and overwrite them
    if (finalMembers && finalMembers.length > 0) {
      const calcAmount = pAmount;
      const calcSplitType = pSplitType;

      let splits;
      try {
        splits = calculateSplits({ amount: parseFloat(calcAmount), split_type: calcSplitType, members: finalMembers });
      } catch (calcError) {
        throw new Error(`Split calculation error: ${calcError.message}`);
      }

      await query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

      for (const split of splits) {
        await query(`
          INSERT INTO expense_splits 
            (expense_id, user_id, amount, percentage)
          VALUES 
            ($1, $2, $3, $4)
        `, [
          expenseId, 
          split.user_id, 
          split.amount, 
          split.percentage || null
        ]);
      }
    }

    // 3. Log History and Notification
    await ensureHistoryTable();
    
    let summaryParts = [];
    if (amount !== undefined && parseFloat(existingExpense.amount) !== parseFloat(amount)) {
      summaryParts.push(`amount from ₹${parseFloat(existingExpense.amount)} to ₹${parseFloat(amount)}`);
    }
    if (note !== undefined && existingExpense.note !== note && (existingExpense.note || note)) {
      summaryParts.push(`note changed`);
    }

    if (splits) {
      let splitDiffs = [];
      const oldMap = new Map(oldSplits.map(s => [s.user_id, parseFloat(s.amount)]));
      
      const userIds = [...new Set([...oldSplits.map(s => s.user_id), ...splits.map(s => s.user_id)])];
      let usersMap = {};
      if (userIds.length > 0) {
        const uRes = await query('SELECT id, name FROM users WHERE id = ANY($1)', [userIds]);
        uRes.rows.forEach(u => usersMap[u.id] = u.name);
      }

      for (const s of splits) {
        const oldAmt = oldMap.get(s.user_id) || 0;
        const newAmt = parseFloat(s.amount);
        if (oldAmt !== newAmt) {
          const userName = usersMap[s.user_id] ? usersMap[s.user_id].split(' ')[0] : 'Someone';
          splitDiffs.push(`${userName}: ₹${oldAmt} → ₹${newAmt}`);
        }
        oldMap.delete(s.user_id);
      }
      for (const [userId, oldAmt] of oldMap.entries()) {
        if (oldAmt > 0) {
          const userName = usersMap[userId] ? usersMap[userId].split(' ')[0] : 'Someone';
          splitDiffs.push(`${userName}: ₹${oldAmt} → ₹0`);
        }
      }
      if (splitDiffs.length > 0) summaryParts.push(`Splits adjusted (${splitDiffs.join(', ')})`);
    }
    
    const changesSummary = summaryParts.length > 0 ? summaryParts.join(', ') : 'Updated expense';

    await query(`
      INSERT INTO expense_history (expense_id, user_id, action_type, changes_summary)
      VALUES ($1, $2, $3, $4)
    `, [expenseId, user.id, 'EDIT', changesSummary]);

    if (updatedExpense.group_id) {
      const msg = `📝 ${user.name} updated the expense "${updatedExpense.title || updatedExpense.note}". (${changesSummary})`;
      await query(`
        INSERT INTO group_messages (group_id, sender_id, message)
        VALUES ($1, $2, $3)
      `, [updatedExpense.group_id, user.id, msg]);
    }

    return NextResponse.json({ success: true, expense: updatedExpense });

  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
});

// DELETE /api/group-expenses/[id]
// Delete a group expense
export const DELETE = withAuth(async (request, user, { params }) => {
  return NextResponse.json({ error: 'Expenses cannot be deleted, only edited. History must be preserved.' }, { status: 403 });
});
