import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// PATCH /api/savings/[id] — Update savings goal (e.g. add funds)
const patchHandler = async (request, user, { params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { saved_amount, is_completed, name, target_amount, target_date, icon, color } = body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (saved_amount !== undefined) { fields.push(`saved_amount = $${idx++}`); values.push(parseFloat(saved_amount)); }
    if (is_completed !== undefined) { fields.push(`is_completed = $${idx++}`); values.push(is_completed); }
    if (name !== undefined)         { fields.push(`name = $${idx++}`);         values.push(name); }
    if (target_amount !== undefined){ fields.push(`target_amount = $${idx++}`);values.push(parseFloat(target_amount)); }
    if (target_date !== undefined)  { fields.push(`target_date = $${idx++}`);  values.push(target_date); }
    if (icon !== undefined)         { fields.push(`icon = $${idx++}`);         values.push(icon); }
    if (color !== undefined)        { fields.push(`color = $${idx++}`);        values.push(color); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(parseInt(id, 10), user.id);
    const result = await query(
      `UPDATE savings_goals SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Patch Savings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

// DELETE /api/savings/[id] — Delete a savings goal
const deleteHandler = async (request, user, { params }) => {
  try {
    const { id } = await params;
    const result = await query(
      `DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id`,
      [parseInt(id, 10), user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete Savings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
