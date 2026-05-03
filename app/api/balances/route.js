import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { simplifyDebts } from '@/lib/debtSimplifier';

// GET /api/balances
// For each group, runs the SAME simplifyDebts algorithm as /api/groups/[id]/balances,
// then extracts only the simplified transactions involving the current user.
// This ensures simplified settlements (cross-person) are handled correctly.
export const GET = withAuth(async (request, user) => {
  try {
    // 1. Find all groups this user belongs to
    const groupsResult = await query(`
      SELECT DISTINCT g.id as group_id, g.name as group_name
      FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND g.is_archived = false
    `, [user.id]);

    // Map: otherId -> { name, upi_id, net, groups[] }
    const globalMap = {};

    // ── Per-group simplified debts ───────────────────────────────────────────
    for (const grp of groupsResult.rows) {
      const gid = grp.group_id;

      // Members
      const membersResult = await query(`
        SELECT u.id, u.name, u.upi_id
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
      `, [gid]);

      const balances = {};
      const userInfo = {};
      membersResult.rows.forEach(m => {
        balances[m.id] = 0;
        userInfo[m.id] = { name: m.name, upi_id: m.upi_id };
      });

      // Credits: what each person paid for expenses
      const credits = await query(`
        SELECT paid_by, SUM(amount) as total
        FROM group_expenses WHERE group_id = $1 GROUP BY paid_by
      `, [gid]);
      credits.rows.forEach(r => {
        if (balances[r.paid_by] !== undefined) balances[r.paid_by] += parseFloat(r.total);
      });

      // Debits: what each person owes from splits
      const debits = await query(`
        SELECT es.user_id, SUM(es.amount) as total
        FROM expense_splits es
        JOIN group_expenses ge ON es.expense_id = ge.id
        WHERE ge.group_id = $1 GROUP BY es.user_id
      `, [gid]);
      debits.rows.forEach(r => {
        if (balances[r.user_id] !== undefined) balances[r.user_id] -= parseFloat(r.total);
      });

      // Settlement credits (paid out — reduces debt)
      const sCredits = await query(`
        SELECT paid_by, SUM(amount) as total
        FROM settlements WHERE group_id = $1 AND status = 'completed' GROUP BY paid_by
      `, [gid]);
      sCredits.rows.forEach(r => {
        if (balances[r.paid_by] !== undefined) balances[r.paid_by] += parseFloat(r.total);
      });

      // Settlement debits (received — reduces credit)
      const sDebits = await query(`
        SELECT paid_to, SUM(amount) as total
        FROM settlements WHERE group_id = $1 AND status = 'completed' GROUP BY paid_to
      `, [gid]);
      sDebits.rows.forEach(r => {
        if (balances[r.paid_to] !== undefined) balances[r.paid_to] -= parseFloat(r.total);
      });

      // Run the minimum cash flow simplification — same as group screen
      const simplified = simplifyDebts(balances);

      // Only pick transactions that involve the current user
      for (const t of simplified) {
        if (t.from !== user.id && t.to !== user.id) continue;

        const amt = parseFloat(t.amount.toFixed(2));
        if (amt < 0.01) continue;

        let otherId, direction;
        if (t.from === user.id) {
          // I owe someone
          otherId = t.to;
          direction = -1;
        } else {
          // Someone owes me
          otherId = t.from;
          direction = +1;
        }

        const otherInfo = userInfo[otherId] || {};
        if (!globalMap[otherId]) {
          globalMap[otherId] = {
            userId: otherId,
            name: otherInfo.name || otherId,
            upi_id: otherInfo.upi_id || null,
            net: 0,
            groups: [],
          };
        }
        globalMap[otherId].net += direction * amt;
        globalMap[otherId].groups.push({
          groupId: gid,
          groupName: grp.group_name,
          net: parseFloat((direction * amt).toFixed(2)),
        });
      }
    }

    // ── Direct (non-group) expenses ──────────────────────────────────────────
    const directExp = await query(`
      SELECT ge.paid_by, es.user_id as split_user, es.amount as split_amount,
             payer.name as payer_name, payer.upi_id as payer_upi,
             splitter.name as splitter_name, splitter.upi_id as splitter_upi
      FROM group_expenses ge
      JOIN expense_splits es ON es.expense_id = ge.id
      JOIN users payer ON payer.id = ge.paid_by
      JOIN users splitter ON splitter.id = es.user_id
      WHERE ge.group_id IS NULL AND ge.paid_by != es.user_id
        AND (ge.paid_by = $1 OR es.user_id = $1)
    `, [user.id]);

    for (const row of directExp.rows) {
      const amt = parseFloat(row.split_amount);
      let otherId, otherName, otherUpi, direction;
      if (row.paid_by === user.id) {
        otherId = row.split_user; otherName = row.splitter_name; otherUpi = row.splitter_upi; direction = +1;
      } else {
        otherId = row.paid_by; otherName = row.payer_name; otherUpi = row.payer_upi; direction = -1;
      }
      if (!globalMap[otherId]) globalMap[otherId] = { userId: otherId, name: otherName, upi_id: otherUpi, net: 0, groups: [] };
      globalMap[otherId].net += direction * amt;

      // Find or create 'Udhaar (Direct)' group entry for this person
      let udhaarGrp = globalMap[otherId].groups.find(g => g.groupId === 'direct');
      if (!udhaarGrp) {
        udhaarGrp = { groupId: 'direct', groupName: 'Udhaar (Direct)', net: 0 };
        globalMap[otherId].groups.push(udhaarGrp);
      }
      udhaarGrp.net += (direction * amt);
      udhaarGrp.net = parseFloat(udhaarGrp.net.toFixed(2));
    }

    // ── Final output ─────────────────────────────────────────────────────────
    const byPerson = Object.values(globalMap)
      .map(b => ({ ...b, net: parseFloat(b.net.toFixed(2)) }))
      .filter(b => Math.abs(b.net) > 0.01);

    const totalNetBalance = byPerson.reduce((s, b) => s + b.net, 0);
    const owedToYou = byPerson.filter(b => b.net > 0).reduce((s, b) => s + b.net, 0);
    const youOwe    = byPerson.filter(b => b.net < 0).reduce((s, b) => s + Math.abs(b.net), 0);

    return NextResponse.json({
      totalNetBalance: parseFloat(totalNetBalance.toFixed(2)),
      owedToYou: parseFloat(owedToYou.toFixed(2)),
      youOwe:    parseFloat(youOwe.toFixed(2)),
      settledCount: 0,
      byPerson,
    });

  } catch (error) {
    console.error('Error fetching global balances:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
});
