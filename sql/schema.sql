-- SmartPocket + SmartSplit PostgreSQL Schema
-- Run this once against your database to set up all tables.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  upi_id        TEXT,                          -- SmartSplit: for UPI settlements
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Expenses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL,
  category_id TEXT           NOT NULL,
  date        DATE           NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses (user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx    ON expenses (date);

-- ─── Budgets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  TEXT           NOT NULL,
  month        TEXT           NOT NULL, -- YYYY-MM
  limit_amount NUMERIC(12, 2) NOT NULL,
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets (user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SMARTSPLIT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Groups ───────────────────────────────────────────────────────────────────
-- type: trip | home | office | couple | custom
CREATE TABLE IF NOT EXISTS groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'custom',
  description TEXT,
  icon        TEXT,        -- emoji override
  color       TEXT,        -- hex color
  currency    TEXT        NOT NULL DEFAULT 'INR',
  created_by  UUID        NOT NULL REFERENCES users(id),
  is_archived BOOLEAN     DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS groups_created_by_idx ON groups (created_by);

-- ─── Group Members ────────────────────────────────────────────────────────────
-- role: admin | member
CREATE TABLE IF NOT EXISTS group_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members (group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx  ON group_members (user_id);

-- ─── Group Expenses ───────────────────────────────────────────────────────────
-- split_type: equal | percentage | custom
CREATE TABLE IF NOT EXISTS group_expenses (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID           NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by     UUID           NOT NULL REFERENCES users(id),
  title       TEXT           NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  category    TEXT           NOT NULL DEFAULT 'other',
  split_type  TEXT           NOT NULL DEFAULT 'equal',
  note        TEXT,
  date        DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS group_expenses_group_id_idx ON group_expenses (group_id);
CREATE INDEX IF NOT EXISTS group_expenses_paid_by_idx  ON group_expenses (paid_by);

-- ─── Expense Splits ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_splits (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID           NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  user_id     UUID           NOT NULL REFERENCES users(id),
  amount      NUMERIC(12, 2) NOT NULL,
  percentage  NUMERIC(5, 2),               -- populated for percentage splits
  is_settled  BOOLEAN        DEFAULT false,
  settled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS expense_splits_expense_id_idx ON expense_splits (expense_id);
CREATE INDEX IF NOT EXISTS expense_splits_user_id_idx    ON expense_splits (user_id);

-- ─── Settlements ──────────────────────────────────────────────────────────────
-- status: pending | completed | cancelled
CREATE TABLE IF NOT EXISTS settlements (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID           NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by         UUID           NOT NULL REFERENCES users(id),
  paid_to         UUID           NOT NULL REFERENCES users(id),
  amount          NUMERIC(12, 2) NOT NULL,
  payment_method  TEXT           NOT NULL DEFAULT 'upi',
  upi_ref         TEXT,                    -- optional reference note
  note            TEXT,
  status          TEXT           NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS settlements_group_id_idx ON settlements (group_id);
CREATE INDEX IF NOT EXISTS settlements_paid_by_idx  ON settlements (paid_by);
CREATE INDEX IF NOT EXISTS settlements_paid_to_idx  ON settlements (paid_to);

