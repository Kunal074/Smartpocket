import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// DELETE a budget
const deleteHandler = async (request, user, context) => {
  try {
    // Next.js 15 requires awaiting params
    const { id } = await context.params;

    const result = await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id', [
      id,
      user.id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Budget not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Budget deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Budget Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE = withAuth(deleteHandler);
