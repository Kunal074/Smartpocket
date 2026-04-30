import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// DELETE /api/recurring/[id] — delete a recurring expense
const deleteHandler = async (request, user, { params }) => {
  try {
    const { id } = await params;
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
    const { id } = await params;
    const body = await request.json();
    const { is_active, note, amount, category_id, frequency, next_date } = body;

    // Build dynamic SET clause based on what's provided
    const fields = [];
    const values = [];
    let idx = 1;

    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }
    if (note !== undefined)      { fields.push(`note = $${idx++}`);      values.push(note); }
    if (amount !== undefined)    { fields.push(`amount = $${idx++}`);    values.push(parseFloat(amount)); }
    if (category_id !== undefined) { fields.push(`category_id = $${idx++}`); values.push(category_id); }
    if (frequency !== undefined) { fields.push(`frequency = $${idx++}`); values.push(frequency); }
    if (next_date !== undefined) { fields.push(`next_date = $${idx++}`); values.push(next_date); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, user.id);
    const result = await query(
      `UPDATE recurring_expenses SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
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
