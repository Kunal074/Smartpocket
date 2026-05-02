import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Enable UUID extension
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT        NOT NULL,
        email         TEXT        UNIQUE NOT NULL,
        phone         VARCHAR(20),
        upi_id        TEXT,
        password_hash TEXT        NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // expenses (personal)
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount      NUMERIC(12, 2) NOT NULL,
        category_id TEXT           NOT NULL,
        date        DATE           NOT NULL,
        note        TEXT,
        created_at  TIMESTAMPTZ    DEFAULT NOW()
      )
    `);

    // personal_bills
    await query(`
      CREATE TABLE IF NOT EXISTS personal_bills (
        id         SERIAL PRIMARY KEY,
        user_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(255)   NOT NULL,
        amount     DECIMAL(12,2)  NOT NULL,
        category   VARCHAR(50)    DEFAULT 'other',
        note       TEXT           DEFAULT '',
        date       DATE           DEFAULT CURRENT_DATE,
        created_at TIMESTAMP      DEFAULT NOW()
      )
    `);

    // budgets
    await query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id  TEXT           NOT NULL,
        month        TEXT           NOT NULL,
        limit_amount NUMERIC(12, 2) NOT NULL,
        created_at   TIMESTAMPTZ    DEFAULT NOW(),
        UNIQUE (user_id, category_id, month)
      )
    `);

    // groups
    await query(`
      CREATE TABLE IF NOT EXISTS groups (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        type        TEXT        NOT NULL DEFAULT 'custom',
        description TEXT,
        icon        TEXT,
        color       TEXT,
        currency    TEXT        NOT NULL DEFAULT 'INR',
        created_by  UUID        NOT NULL REFERENCES users(id),
        is_archived BOOLEAN     DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // group_members
    await query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id  UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role      TEXT        NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (group_id, user_id)
      )
    `);

    // group_expenses
    await query(`
      CREATE TABLE IF NOT EXISTS group_expenses (
        id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id    UUID           REFERENCES groups(id) ON DELETE CASCADE,
        paid_by     UUID           NOT NULL REFERENCES users(id),
        title       TEXT           NOT NULL,
        amount      NUMERIC(12, 2) NOT NULL,
        category    TEXT           NOT NULL DEFAULT 'other',
        split_type  TEXT           NOT NULL DEFAULT 'equal',
        note        TEXT,
        date        DATE           NOT NULL DEFAULT CURRENT_DATE,
        created_at  TIMESTAMPTZ    DEFAULT NOW(),
        updated_at  TIMESTAMPTZ    DEFAULT NOW()
      )
    `);

    // expense_splits
    await query(`
      CREATE TABLE IF NOT EXISTS expense_splits (
        id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id  UUID           NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
        user_id     UUID           NOT NULL REFERENCES users(id),
        amount      NUMERIC(12, 2) NOT NULL,
        percentage  NUMERIC(5, 2),
        is_settled  BOOLEAN        DEFAULT false,
        settled_at  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ    DEFAULT NOW(),
        UNIQUE (expense_id, user_id)
      )
    `);

    // settlements
    await query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id        UUID           REFERENCES groups(id) ON DELETE CASCADE,
        paid_by         UUID           NOT NULL REFERENCES users(id),
        paid_to         UUID           NOT NULL REFERENCES users(id),
        amount          NUMERIC(12, 2) NOT NULL,
        payment_method  TEXT           NOT NULL DEFAULT 'upi',
        upi_ref         TEXT,
        note            TEXT,
        status          TEXT           NOT NULL DEFAULT 'pending',
        created_at      TIMESTAMPTZ    DEFAULT NOW(),
        completed_at    TIMESTAMPTZ
      )
    `);

    // group_messages
    await query(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_id  UUID        NOT NULL REFERENCES users(id),
        message    TEXT        NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // expense_comments
    await query(`
      CREATE TABLE IF NOT EXISTS expense_comments (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID        REFERENCES group_expenses(id) ON DELETE CASCADE,
        user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
        comment    TEXT        NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // expense_history
    await query(`
      CREATE TABLE IF NOT EXISTS expense_history (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id      UUID        NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
        user_id         UUID        NOT NULL REFERENCES users(id),
        action_type     VARCHAR(50) NOT NULL,
        changes_summary TEXT        NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // recurring expenses
    await query(`
      CREATE TABLE IF NOT EXISTS recurring_expenses (
        id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       TEXT           NOT NULL,
        amount      NUMERIC(12, 2) NOT NULL,
        category    TEXT           NOT NULL DEFAULT 'other',
        frequency   TEXT           NOT NULL DEFAULT 'monthly',
        next_date   DATE           NOT NULL,
        is_active   BOOLEAN        DEFAULT true,
        note        TEXT,
        created_at  TIMESTAMPTZ    DEFAULT NOW()
      )
    `);

    // savings goals
    await query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title         TEXT           NOT NULL,
        target_amount NUMERIC(12, 2) NOT NULL,
        saved_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
        icon          TEXT           DEFAULT '🎯',
        color         TEXT           DEFAULT '#5A67D8',
        deadline      DATE,
        created_at    TIMESTAMPTZ    DEFAULT NOW()
      )
    `);

    // friends
    await query(`
      CREATE TABLE IF NOT EXISTS friends (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, friend_id)
      )
    `);

    // email OTPs
    await query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id         SERIAL PRIMARY KEY,
        email      VARCHAR(255) NOT NULL,
        otp        VARCHAR(6)   NOT NULL,
        expires_at TIMESTAMPTZ  NOT NULL,
        created_at TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    return NextResponse.json({
      success: true,
      message: '✅ All SmartPocket tables created successfully on Neon!'
    });

  } catch (error) {
    console.error('Init DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
