import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST() {
  try {
    // Generate a unique suffix for this guest session to prevent overlap
    const suffix = Math.floor(100000 + Math.random() * 900000);
    const guestEmail = `guest_${suffix}@smartpocket.app`;
    const guestPhone = `999${suffix}`;
    
    // Hash password for secure record creation
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('demopassword', salt);

    // 1. Create the primary Guest User
    const guestUserRes = await query(
      `INSERT INTO users (name, email, phone, upi_id, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, upi_id`,
      ['Guest User', guestEmail, guestPhone, 'guest@upi', passwordHash]
    );
    const guestUser = guestUserRes.rows[0];
    const guestUserId = guestUser.id;

    // 2. Create standard virtual friends (Rahul and Priya) to showcase splitting
    const rahulRes = await query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Rahul Sharma', `rahul_${suffix}@smartpocket.app`, `888${suffix}`, '']
    );
    const priyaRes = await query(
      `INSERT INTO users (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['Priya Patel', `priya_${suffix}@smartpocket.app`, `777${suffix}`, '']
    );
    const rahulId = rahulRes.rows[0].id;
    const priyaId = priyaRes.rows[0].id;

    // 3. Seed personal budgets for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const budgetsToSeed = [
      { cat: 'rent', limit: 20000 },
      { cat: 'groceries', limit: 10000 },
      { cat: 'food', limit: 5000 },
      { cat: 'transport', limit: 3000 }
    ];
    for (const b of budgetsToSeed) {
      await query(
        `INSERT INTO budgets (user_id, category_id, month, limit_amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [guestUserId, b.cat, currentMonth, b.limit]
      );
    }

    // 4. Seed personal expenses
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const currentMonthFirstDay = `${currentMonth}-01`;

    const personalExpenses = [
      { amount: 15000, category: 'rent', date: currentMonthFirstDay, note: 'Monthly apartment rent' },
      { amount: 4820, category: 'groceries', date: today, note: 'BigBasket pantry refill' },
      { amount: 2160, category: 'food', date: today, note: 'Dinner & Chai' },
      { amount: 1340, category: 'transport', date: yesterday, note: 'Uber ride to office' }
    ];
    for (const e of personalExpenses) {
      await query(
        `INSERT INTO expenses (user_id, amount, category_id, date, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [guestUserId, e.amount, e.category, e.date, e.note]
      );
    }

    // 5. Seed Savings Goals
    const savingsGoals = [
      { name: 'New Laptop', target: 90000, saved: 25000, icon: '💻', color: '#4f46e5' },
      { name: 'Emergency Fund', target: 50000, saved: 15000, icon: '🛡️', color: '#10b981' }
    ];
    for (const g of savingsGoals) {
      await query(
        `INSERT INTO savings_goals (user_id, name, title, target_amount, saved_amount, icon, color, target_date, is_completed)
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8)`,
        [guestUserId, g.name, g.target, g.saved, g.icon, g.color, new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), false]
      );
    }

    // 6. Seed SmartSplit roommate group
    const groupRes = await query(
      `INSERT INTO groups (name, type, description, icon, color, currency, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      ['Flatmates 302', 'home', 'Co-living monthly splits', '🏠', '#f59e0b', 'INR', guestUserId]
    );
    const groupId = groupRes.rows[0].id;

    // Add members
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`, [groupId, guestUserId, 'admin']);
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`, [groupId, rahulId, 'member']);
    await query(`INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)`, [groupId, priyaId, 'member']);

    // Seed group expenses
    // Expense A: Paid by Guest, split equally
    const expARes = await query(
      `INSERT INTO group_expenses (group_id, paid_by, title, amount, category, split_type, note, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [groupId, guestUserId, 'High-Speed Wi-Fi', 1500.00, 'utilities', 'equal', 'Airtel Broadband monthly charges', today]
    );
    const expAId = expARes.rows[0].id;

    // Splits for Expense A (500 each)
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expAId, guestUserId, 500.00]);
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expAId, rahulId, 500.00]);
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expAId, priyaId, 500.00]);

    // Expense B: Paid by Rahul, split equally
    const expBRes = await query(
      `INSERT INTO group_expenses (group_id, paid_by, title, amount, category, split_type, note, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [groupId, rahulId, 'Chai & Snacks', 900.00, 'food', 'equal', 'Tapri tea and samosas for evening team catchup', yesterday]
    );
    const expBId = expBRes.rows[0].id;

    // Splits for Expense B (300 each)
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expBId, guestUserId, 300.00]);
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expBId, rahulId, 300.00]);
    await query(`INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)`, [expBId, priyaId, 300.00]);

    // 7. Seed Group Chat messages
    await query(
      `INSERT INTO group_messages (group_id, sender_id, message, created_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
      [groupId, rahulId, 'Hey guys! Added the chai split from yesterday ☕']
    );
    await query(
      `INSERT INTO group_messages (group_id, sender_id, message, created_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '45 minutes')`,
      [groupId, priyaId, 'Awesome! I will update the electricity bill as soon as the meter reading comes.']
    );
    await query(
      `INSERT INTO group_messages (group_id, sender_id, message, created_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '15 minutes')`,
      [groupId, guestUserId, 'Sounds great! Thanks for organizing. Broadband bill paid and logged. 👍']
    );

    // 8. Sign JWT Token
    const token = signToken({ id: guestUser.id, email: guestUser.email, name: guestUser.name });

    return NextResponse.json({
      success: true,
      user: guestUser,
      token,
      message: 'Demo session created successfully!'
    }, { status: 201 });

  } catch (error) {
    console.error('Demo Mode Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start demo' }, { status: 500 });
  }
}
