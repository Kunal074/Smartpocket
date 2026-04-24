import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { calculateSplits } from '@/lib/splitCalculator';

// GET /api/groups/[id]/expenses
// List expenses for a group (latest first)
export const GET = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
    // Check membership
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const expensesResult = await query(`
      SELECT 
        ge.*, 
        u.name as paid_by_name, 
        u.email as paid_by_email
      FROM group_expenses ge
      JOIN users u ON ge.paid_by = u.id
      WHERE ge.group_id = $1
      ORDER BY ge.date DESC, ge.created_at DESC
      LIMIT 100
    `, [groupId]);

    return NextResponse.json(expensesResult.rows);

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
});

// POST /api/groups/[id]/expenses
// Create a new expense and auto-calculate the splits
export const POST = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId } = await params;
    
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

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

    // Use our splitCalculator utility to generate the exact amounts per member
    let splits;
    try {
      splits = calculateSplits({ amount: parseFloat(amount), split_type, members });
    } catch (calcError) {
      return NextResponse.json({ error: calcError.message }, { status: 400 });
    }

    // Start a transaction
    const client = await query('BEGIN');
    
    try {
      // 1. Insert the group_expense
      const expenseResult = await query(`
        INSERT INTO group_expenses 
          (group_id, paid_by, title, amount, category, split_type, note, date)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_DATE))
        RETURNING *
      `, [groupId, paid_by, title, amount, category, split_type, note, date || null]);
      
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
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
});
