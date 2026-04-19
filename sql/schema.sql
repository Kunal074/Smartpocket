-- SmartPocket PostgreSQL Schema
-- Run this once against your database to set up all tables.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
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
