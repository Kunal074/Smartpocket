import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// DELETE /api/recurring/[id] — delete a recurring expense
const deleteHandler = async (request, user, { params }) => {
  try {
    const { id } = params;
    const result = await query(
      `DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, user.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete Recurring Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// PATCH /api/recurring/[id] — toggle is_active
const patchHandler = async (request, user, { params }) => {
  try {
    const { id } = params;
    const { is_active } = await request.json();
    const result = await query(
      `UPDATE recurring_expenses SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
      [is_active, id, user.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Patch Recurring Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE = withAuth(deleteHandler);
export const PATCH = withAuth(patchHandler);
