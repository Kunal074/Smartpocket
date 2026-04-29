import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// POST /api/groups/[id]/expenses/[expenseId]/comments
// Add a comment to an expense
export const POST = withAuth(async (request, user, { params }) => {
  try {
    const { id: groupId, expenseId } = await params;
    
    const body = await request.json();
    const { comment } = body;

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }
    
    // Check membership
    const memberCheck = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, user.id]
    );
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Insert comment
    const result = await query(`
      INSERT INTO expense_comments (expense_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [expenseId, user.id, comment.trim()]);

    const newComment = result.rows[0];

    // Fetch user details for the response
    const userResult = await query('SELECT name FROM users WHERE id = $1', [user.id]);
    newComment.user_name = userResult.rows[0].name;

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
});
