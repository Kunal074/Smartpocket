import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { calculateSplits } from '@/lib/splitCalculator';

// Helper to get expense and check auth
async function getExpenseAndCheckAuth(expenseId, userId) {
  const expenseResult = await query('SELECT * FROM group_expenses WHERE id = $1', [expenseId]);
  const expense = expenseResult.rows[0];
  
  if (!expense) return null;

  // Check if user is in the group
  const memberCheck = await query(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [expense.group_id, userId]
  );
  
  return memberCheck.rowCount > 0 ? expense : null;
}

// PUT /api/group-expenses/[id]
// Edit an existing group expense
export const PUT = withAuth(async (request, { user, params }) => {
  try {
    const expenseId = params.id;
    
    const existingExpense = await getExpenseAndCheckAuth(expenseId, user.id);
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      title, 
      amount, 
      category, 
      split_type, 
      note, 
      date,
      paid_by,
      members // New split members
    } = body;

    // Start a transaction
    const client = await query('BEGIN');

    try {
      // 1. Update the main expense record
      const updatedExpenseResult = await query(`
        UPDATE group_expenses
        SET 
          title = COALESCE($1, title),
          amount = COALESCE($2, amount),
          category = COALESCE($3, category),
          split_type = COALESCE($4, split_type),
          note = COALESCE($5, note),
          date = COALESCE($6, date),
          paid_by = COALESCE($7, paid_by),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [title, amount, category, split_type, note, date, paid_by, expenseId]);

      const updatedExpense = updatedExpenseResult.rows[0];

      // 2. If splits/members are provided, re-calculate and overwrite them
      if (members && members.length > 0) {
        // Use updated values for calc
        const calcAmount = amount || updatedExpense.amount;
        const calcSplitType = split_type || updatedExpense.split_type;

        let splits;
        try {
          splits = calculateSplits({ amount: parseFloat(calcAmount), split_type: calcSplitType, members });
        } catch (calcError) {
          throw new Error(`Split calculation error: ${calcError.message}`);
        }

        // Delete old splits
        await query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

        // Insert new splits
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

      await query('COMMIT');

      return NextResponse.json({ success: true, expense: updatedExpense });

    } catch (txError) {
      await query('ROLLBACK');
      console.error('Transaction error:', txError);
      return NextResponse.json({ error: txError.message || 'Failed to update expense' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
});

// DELETE /api/group-expenses/[id]
// Delete a group expense
export const DELETE = withAuth(async (request, { user, params }) => {
  try {
    const expenseId = params.id;
    
    const existingExpense = await getExpenseAndCheckAuth(expenseId, user.id);
    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    // expense_splits will cascade delete
    await query('DELETE FROM group_expenses WHERE id = $1', [expenseId]);

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
});
