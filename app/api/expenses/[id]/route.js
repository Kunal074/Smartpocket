import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// PUT update an expense
const putHandler = async (request, user, context) => {
  try {
    // Next.js 15 requires awaiting params
    const { id } = await context.params;
    const body = await request.json();
    const { amount, categoryId, date, note } = body;

    if (!amount || !categoryId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(
      'UPDATE expenses SET amount = $1, category_id = $2, date = $3, note = $4 WHERE id = $5 AND user_id = $6 RETURNING id, amount, category_id as "categoryId", date, note, created_at',
      [amount, categoryId, date, note || '', id, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    const expense = {
      ...result.rows[0],
      amount: parseFloat(result.rows[0].amount),
      date: new Date(result.rows[0].date).toISOString().slice(0, 10),
    };

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error('Update Expense Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE an expense
const deleteHandler = async (request, user, context) => {
  try {
    // Next.js 15 requires awaiting params
    const { id } = await context.params;

    const result = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      user.id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Expense not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Expense Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
