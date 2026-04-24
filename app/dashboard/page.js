'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import {
  TrendingUp, Wallet, ChevronRight, Plus,
  Users, MessageSquare, Globe, RefreshCw, User,
} from 'lucide-react';

const CATEGORY_EMOJI = {
  food: '🍔', transport: '🚕', groceries: '🛒', rent: '🏠',
  entertainment: '🎬', health: '💊', shopping: '🛍️', utilities: '⚡',
  travel: '✈️', education: '📚', other: '💸',
};

const QUICK_ACTIONS = [
  { label: 'Fetch From SMS',     icon: MessageSquare, href: '#',                        color: 'var(--sp-accent)' },
  { label: 'Fetch Online Bills', icon: Globe,         href: '#',                        color: '#34d399' },
  { label: 'Add Recurring',      icon: RefreshCw,     href: '/dashboard/recurring',     color: '#a78bfa' },
  { label: 'Personal Expense',   icon: User,          href: '/dashboard/expenses',      color: '#fbbf24' },
];

// Inline-style helpers using CSS variables
const card = {
  background: 'var(--sp-card)',
  border: '1px solid var(--sp-border)',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { expenses, fetchExpenses, isLoading } = useExpenses();

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const now   = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);

  const todaySpend = expenses
    .filter(e => e.date?.slice(0, 10) === today)
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const monthSpend = expenses
    .filter(e => e.date?.slice(0, 7) === month)
    .reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour      = now.getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--sp-accent-bg)', borderTopColor: 'var(--sp-accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-6">

      {/* ── Greeting ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--sp-accent)' }}>
            {greeting} 👋
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--sp-text)' }}>
            {firstName}
          </h1>
        </div>
        <Link
          href="/dashboard/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105"
          style={{ background: 'var(--sp-accent-bg)', border: '1px solid var(--sp-accent-border)' }}
        >
          <User className="h-5 w-5" style={{ color: 'var(--sp-accent)' }} />
        </Link>
      </div>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl p-3.5" style={card}>
          <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--sp-text-muted)' }}>Today</p>
          <p className="font-display text-base font-bold tabular-nums" style={{ color: 'var(--sp-text)' }}>
            ₹{todaySpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-2xl p-3.5" style={card}>
          <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--sp-text-muted)' }}>This Month</p>
          <p className="font-display text-base font-bold tabular-nums" style={{ color: 'var(--sp-text)' }}>
            ₹{monthSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div
          className="rounded-2xl p-3.5"
          style={{ background: 'var(--sp-accent-bg)', border: '1px solid var(--sp-accent-border)' }}
        >
          <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--sp-accent)' }}>You get</p>
          <p className="font-display text-base font-bold tabular-nums" style={{ color: 'var(--sp-accent)' }}>
            ₹0
          </p>
        </div>
      </div>

      {/* ── Recent Groups ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold" style={{ color: 'var(--sp-text)' }}>Recent Groups</h2>
          <Link href="/dashboard/groups" className="text-xs font-semibold" style={{ color: 'var(--sp-accent)' }}>
            See All
          </Link>
        </div>

        <div
          className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all hover:scale-[1.01]"
          style={card}
        >
          <Link href="/dashboard/groups" className="flex items-center gap-3 flex-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              style={{ background: 'var(--sp-accent-bg)' }}
            >
              👥
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--sp-text)' }}>View all groups</p>
              <p className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>Track shared expenses</p>
            </div>
          </Link>
          <Link
            href="/dashboard/groups"
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:scale-110"
            style={{ background: 'var(--sp-accent-bg)', border: '1px solid var(--sp-accent-border)' }}
          >
            <Plus className="h-4 w-4" style={{ color: 'var(--sp-accent)' }} />
          </Link>
        </div>
      </div>

      {/* ── Primary Action Buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/groups"
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'var(--sp-card)',
            border: '1.5px dashed var(--sp-accent-border)',
            color: 'var(--sp-accent)',
          }}
        >
          <Users className="h-4 w-4" />
          Create a Group
        </Link>
        <Link
          href="/dashboard/expenses"
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
          style={{
            background: 'var(--sp-gradient)',
            color: '#ffffff',
            boxShadow: '0 8px 24px -8px rgba(73,152,214,0.5)',
          }}
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Link>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-all hover:scale-105 active:scale-95"
              style={card}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'var(--sp-accent-bg)' }}
              >
                <Icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <p className="text-[9px] font-semibold leading-tight" style={{ color: 'var(--sp-text-muted)' }}>
                {action.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ── Recent Transactions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold" style={{ color: 'var(--sp-text)' }}>
            Recent Transactions
          </h2>
          <Link
            href="/dashboard/expenses"
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--sp-accent)' }}
          >
            See All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-3xl py-10 text-center"
            style={{ background: 'var(--sp-card)', border: '1px solid var(--sp-border)' }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
              style={{ background: 'var(--sp-accent-bg)' }}
            >
              <Wallet className="h-7 w-7" style={{ color: 'var(--sp-accent)' }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--sp-text)' }}>No expenses yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--sp-text-faint)' }}>
              Add your first expense to get started
            </p>
            <Link
              href="/dashboard/expenses"
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'var(--sp-gradient)' }}
            >
              Add Expense
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((expense) => {
              const emoji   = CATEGORY_EMOJI[expense.category_id] || CATEGORY_EMOJI[expense.categoryId] || '💸';
              const expDate = new Date(expense.date);
              const isToday = expense.date?.slice(0, 10) === today;
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 transition-all hover:scale-[1.01]"
                  style={card}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ background: 'var(--sp-accent-bg)' }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--sp-text)' }}>
                        {expense.note || expense.category_id || 'Expense'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--sp-text-muted)' }}>
                        {isToday ? 'Today' : expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <p className="font-display font-bold text-sm tabular-nums" style={{ color: '#e05252' }}>
                    −₹{parseFloat(expense.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
