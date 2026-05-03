import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// PATCH /api/savings/[id] — Update savings goal + auto-sync Arena
const patchHandler = async (request, user, { params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { saved_amount, is_completed, name, target_amount, target_date, icon, color } = body;

    // Get old saved_amount to compute delta for Arena sync
    const existing = await query(
      `SELECT saved_amount FROM savings_goals WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

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

    values.push(id, user.id);
    const result = await query(
      `UPDATE savings_goals SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = result.rows[0];

    // ── Auto-sync Arena ──────────────────────────────────────────────────
    if (saved_amount !== undefined && existing.rowCount > 0) {
      const oldSaved = parseFloat(existing.rows[0].saved_amount);
      const newSaved = parseFloat(saved_amount);
      const delta = newSaved - oldSaved;

      if (delta > 0) {
        const month = new Date().toISOString().slice(0, 7);
        const arena = await query(
          `SELECT * FROM savings_challenges WHERE user_id = $1 AND month = $2`,
          [user.id, month]
        );

        if (arena.rowCount > 0) {
          const ac = arena.rows[0];
          const arenaNewSaved = parseFloat(ac.saved_amount) + delta;
          const pct = arenaNewSaved / parseFloat(ac.target_amount);
          const base = Math.min(pct * 1000, 1000);
          const goalBonus = arenaNewSaved >= parseFloat(ac.target_amount) ? 500 : 0;
          const overBonus = arenaNewSaved > parseFloat(ac.target_amount)
            ? Math.floor(((pct - 1) / 0.1)) * 100 : 0;
          const newPoints = Math.round(base + goalBonus + overBonus);
          const justCompleted = arenaNewSaved >= parseFloat(ac.target_amount) && !ac.is_completed;

          await query(
            `UPDATE savings_challenges
             SET saved_amount = $1, points = $2, is_completed = $3,
                 achieved_at = CASE WHEN $3 = true AND achieved_at IS NULL THEN NOW() ELSE achieved_at END
             WHERE user_id = $4 AND month = $5`,
            [arenaNewSaved, newPoints, arenaNewSaved >= parseFloat(ac.target_amount), user.id, month]
          );

          return NextResponse.json({
            ...updated,
            arena_synced: true,
            arena_just_completed: justCompleted,
            arena_points: newPoints,
          }, { status: 200 });
        }
      }
    }

    return NextResponse.json(updated, { status: 200 });
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
      [id, user.id]
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
