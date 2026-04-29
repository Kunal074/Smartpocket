import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/groups/[id]/expenses/[expenseId]
// Fetch a specific expense, its splits, and comments
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId, expenseId } = await params;
    
    // Check membership
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 1. Get the expense details
    const expenseResult = await query(`
      SELECT 
        ge.*, 
        u.name as paid_by_name, 
        u.email as paid_by_email
      FROM group_expenses ge
      JOIN users u ON ge.paid_by = u.id
      WHERE ge.id = $1 AND ge.group_id = $2
    `, [expenseId, groupId]);

    if (expenseResult.rowCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    const expense = expenseResult.rows[0];

    // 2. Get the splits
    const splitsResult = await query(`
      SELECT 
        es.*,
        u.name as user_name,
        u.email as user_email
      FROM expense_splits es
      JOIN users u ON es.user_id = u.id
      WHERE es.expense_id = $1
    `, [expenseId]);

    // 3. Try to create the comments table if it doesn't exist (Migration hack)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS expense_comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          expense_id UUID REFERENCES group_expenses(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          comment TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      console.warn("Failed to ensure expense_comments table exists:", e);
    }

    // 4. Get the comments
    const commentsResult = await query(`
      SELECT 
        ec.*,
        u.name as user_name
      FROM expense_comments ec
      JOIN users u ON ec.user_id = u.id
      WHERE ec.expense_id = $1
      ORDER BY ec.created_at ASC
    `, [expenseId]);

    return NextResponse.json({
      expense,
      splits: splitsResult.rows,
      comments: commentsResult.rows
    });

  } catch (error) {
    console.error('Error fetching expense details:', error);
    return NextResponse.json({ error: 'Failed to fetch expense details' }, { status: 500 });
  }
});

// DELETE /api/groups/[id]/expenses/[expenseId]
// Delete a specific expense
export const DELETE = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId, expenseId } = await params;
    
    // Check membership & permissions (only creator, paid_by, or admin can delete)
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    // Block deletion completely to preserve history
    return NextResponse.json({ error: 'Deletion is disabled to preserve expense history.' }, { status: 403 });
    // but just to be safe we can manually delete splits first if cascade isn't on.
    // Code removed because deletion is blocked

  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
});

// PUT /api/groups/[id]/expenses/[expenseId]
// Update an existing expense and recalculate splits
import { calculateSplits } from '@/lib/splitCalculator';

export const PUT = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId, expenseId } = await params;
    
    // Check membership & permissions
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    // We removed the creator-only edit restriction so any member can edit
    // but we still check if the expense exists in this group
    const expenseCheck = await query('SELECT * FROM group_expenses WHERE id = $1 AND group_id = $2', [expenseId, groupId]);
    if (expenseCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    const existingExpense = expenseCheck.rows[0];

    const body = await request.json();
    const { 
      title, 
      amount, 
      category = 'other', 
      split_type = 'equal', 
      note = '', 
      date,
      paid_by = user.id,
      members // Array of { user_id, percentage?, amount? }
    } = body;

    if (!title || !amount || !members || members.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch old splits for history diff
    const oldSplitsResult = await query('SELECT user_id, amount FROM expense_splits WHERE expense_id = $1', [expenseId]);
    const oldSplits = oldSplitsResult.rows;

    // Recalculate splits
    let splits;
    try {
      splits = calculateSplits({ amount: parseFloat(amount), split_type, members });
    } catch (calcError) {
      return NextResponse.json({ error: calcError.message }, { status: 400 });
    }

    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // 1. Update the group_expense
      const expenseResult = await query(`
        UPDATE group_expenses 
        SET paid_by = $1, title = $2, amount = $3, category = $4, split_type = $5, note = $6, date = COALESCE($7, date)
        WHERE id = $8 AND group_id = $9
        RETURNING *
      `, [paid_by, title, amount, category, split_type, note, date || null, expenseId, groupId]);
      
      const updatedExpense = expenseResult.rows[0];

      // 2. Delete old splits
      await query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

      // 3. Insert new splits
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

      // 4. Ensure History Table and Insert History
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

      let summaryParts = [];
      if (parseFloat(existingExpense.amount) !== parseFloat(amount)) {
        summaryParts.push(`amount from ₹${parseFloat(existingExpense.amount)} to ₹${parseFloat(amount)}`);
      }
      if (existingExpense.title !== title) summaryParts.push(`title changed`);
      if (existingExpense.note !== note && (existingExpense.note || note)) summaryParts.push(`note changed`);
      if (existingExpense.paid_by !== paid_by) summaryParts.push(`payer changed`);
      if (existingExpense.split_type !== split_type) summaryParts.push(`split type changed to ${split_type}`);
      
      // Compute split changes if amount didn't change (if amount changed, obviously splits changed)
      if (parseFloat(existingExpense.amount) === parseFloat(amount)) {
        let splitDiffs = [];
        const oldMap = new Map(oldSplits.map(s => [s.user_id, parseFloat(s.amount)]));
        
        // Fetch user names for readable diff
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
      
      const changesSummary = summaryParts.length > 0 ? summaryParts.join(', ') : 'Updated expense details';

      await query(`
        INSERT INTO expense_history (expense_id, user_id, action_type, changes_summary)
        VALUES ($1, $2, $3, $4)
      `, [expenseId, user.id, 'EDIT', changesSummary]);

      // 5. Add notification to group chat
      const msg = `📝 ${user.name} updated the expense "${updatedExpense.title || updatedExpense.note}". (${changesSummary})`;
      await query(`
        INSERT INTO group_messages (group_id, sender_id, message)
        VALUES ($1, $2, $3)
      `, [groupId, user.id, msg]);

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        expense: updatedExpense,
        splits
      });
      
    } catch (txError) {
      await query('ROLLBACK');
      throw txError;
    }

  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
});
