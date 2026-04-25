import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';

// GET /api/balances
export const GET = withAuth(async (request, user) => {
  try {
    const result = await query(`
      SELECT
        ge.id as expense_id,
        ge.group_id,
        COALESCE(g.name, 'Udhaar (Direct)') as group_name,
        COALESCE((SELECT COUNT(*) FROM group_members WHERE group_id = g.id), 2) as group_member_count,
        ge.paid_by,
        payer.name as payer_name,
        ge.amount as total_amount,
        ge.title,
        es.user_id as split_user_id,
        es.amount as split_amount,
        splitter.name as splitter_name
      FROM group_expenses ge
      LEFT JOIN groups g ON ge.group_id = g.id
      JOIN expense_splits es ON es.expense_id = ge.id
      JOIN users payer ON payer.id = ge.paid_by
      JOIN users splitter ON splitter.id = es.user_id
      WHERE ge.paid_by != es.user_id
        AND (
          (ge.group_id IS NOT NULL AND EXISTS (SELECT 1 FROM group_members WHERE group_id = ge.group_id AND user_id = $1))
          OR 
          (ge.group_id IS NULL AND (ge.paid_by = $1 OR es.user_id = $1))
        )
    `, [user.id]);

    const rows = result.rows;

    // Map: otherId -> { name, phone, net, groupMap: { groupId -> { name, memberCount, net } } }
    const balanceMap = {};

    for (const row of rows) {
      const paidBy = row.paid_by;
      const splitUser = row.split_user_id;
      const amount = parseFloat(row.split_amount);

      if (paidBy !== user.id && splitUser !== user.id) continue;

      let otherId, otherName, direction;

      if (paidBy === user.id) {
        otherId = splitUser;
        otherName = row.splitter_name;
        direction = +1;
      } else {
        otherId = paidBy;
        otherName = row.payer_name;
        direction = -1;
      }

      if (!balanceMap[otherId]) {
        balanceMap[otherId] = { userId: otherId, name: otherName, net: 0, groupMap: {} };
      }
      balanceMap[otherId].net += direction * amount;

      const gid = row.group_id;
      if (!balanceMap[otherId].groupMap[gid]) {
        balanceMap[otherId].groupMap[gid] = { groupId: gid, groupName: row.group_name, memberCount: parseInt(row.group_member_count), net: 0 };
      }
      balanceMap[otherId].groupMap[gid].net += direction * amount;
    }

    const byPerson = Object.values(balanceMap).map(b => ({
      userId: b.userId,
      name: b.name,
      phone: '',
      net: parseFloat(b.net.toFixed(2)),
      groups: Object.values(b.groupMap).map(g => ({ ...g, net: parseFloat(g.net.toFixed(2)) })),
    })).filter(b => Math.abs(b.net) > 0.01);

    const totalNetBalance = byPerson.reduce((sum, b) => sum + b.net, 0);
    const owedToYou = byPerson.filter(b => b.net > 0).reduce((sum, b) => sum + b.net, 0);
    const youOwe = byPerson.filter(b => b.net < 0).reduce((sum, b) => sum + Math.abs(b.net), 0);
    const settledCount = 0; // For future settlement tracking

    return NextResponse.json({
      totalNetBalance: parseFloat(totalNetBalance.toFixed(2)),
      owedToYou: parseFloat(owedToYou.toFixed(2)),
      youOwe: parseFloat(youOwe.toFixed(2)),
      settledCount,
      byPerson,
    });

  } catch (error) {
    console.error('Error fetching global balances:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
});

