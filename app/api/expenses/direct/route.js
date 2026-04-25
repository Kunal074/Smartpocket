import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { calculateSplits } from '@/lib/splitCalculator';

// POST /api/expenses/direct
// Create a direct 1-to-1 non-group expense
export const POST = withAuth(async (request, user) => {
  try {
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

    // Verify all added members are actually in the friends list (Optional but good for security)
    // For now we trust the payload since it comes from the app's selected friends.

    // Calculate splits
    let splits;
    try {
      splits = calculateSplits({ amount: parseFloat(amount), split_type, members });
    } catch (calcError) {
      return NextResponse.json({ error: calcError.message }, { status: 400 });
    }

    // Start transaction
    await query('BEGIN');
    
    try {
      // 1. Insert into group_expenses with NULL group_id
      const expenseResult = await query(`
        INSERT INTO group_expenses 
          (group_id, paid_by, title, amount, category, split_type, note, date)
        VALUES 
          (NULL, $1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_DATE))
        RETURNING *
      `, [paid_by, title, amount, category, split_type, note, date || null]);
      
      const newExpense = expenseResult.rows[0];

      // 2. Insert the generated expense_splits
      for (const split of splits) {
        await query(`
          INSERT INTO expense_splits 
            (expense_id, user_id, amount, percentage)
          VALUES 
            ($1, $2, $3, $4)
        `, [
          newExpense.id, 
          split.user_id, 
          split.amount, 
          split.percentage || null
        ]);
      }

      await query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        expense: newExpense,
        splits
      }, { status: 201 });
      
    } catch (txError) {
      await query('ROLLBACK');
      throw txError;
    }

  } catch (error) {
    console.error('Error creating direct expense:', error);
    return NextResponse.json({ error: 'Failed to create direct expense' }, { status: 500 });
  }
});
