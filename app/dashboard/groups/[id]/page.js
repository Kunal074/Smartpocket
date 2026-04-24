'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, Wallet, Receipt, Settings, Share2, Download, MessageCircle } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import AddGroupExpenseSheet from '@/components/groups/AddGroupExpenseSheet';
import BalanceSheet from '@/components/groups/BalanceSheet';

const CATEGORY_EMOJI = {
  food: '🍔', transport: '🚕', groceries: '🛒', rent: '🏠',
  entertainment: '🎬', health: '💊', shopping: '🛍️', utilities: '⚡',
  travel: '✈️', education: '📚', other: '💸',
};

const TABS = [
  { id: 'expenses', label: 'Expense',  icon: Receipt },
  { id: 'balances', label: 'Balance',  icon: Wallet },
  { id: 'chat',     label: 'Chat',     icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function GroupDetailPage({ params }) {
  const unwrappedParams = use(params);
  const groupId = unwrappedParams.id;

  const { currentGroup, fetchGroupDetails, isLoading: groupLoading } = useGroups();
  const { expenses, fetchExpenses, isLoading: expensesLoading } = useGroupExpenses();

  const [activeTab, setActiveTab] = useState('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    fetchGroupDetails(groupId);
    fetchExpenses(groupId);
  }, [groupId, fetchGroupDetails, fetchExpenses]);

  if (groupLoading && !currentGroup) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'rgba(73,152,214,0.3)', borderTopColor: '#4998d6' }}
        />
      </div>
    );
  }

  if (!currentGroup && !groupLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold" style={{ color: '#cfe2f9' }}>Group not found</h2>
        <p style={{ color: 'rgba(136,189,242,0.55)' }}>This group may have been deleted or you lost access.</p>
        <Link href="/dashboard/groups" style={{ color: '#4998d6' }} className="hover:underline font-semibold">
          ← Back to Groups
        </Link>
      </div>
    );
  }

  if (!currentGroup) return null;

  return (
    <div className="space-y-4 pb-24 lg:pb-6">

      {/* Back */}
      <Link
        href="/dashboard/groups"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: 'rgba(136,189,242,0.6)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Groups
      </Link>

      {/* Group Header — matches Splitkaro screenshot */}
      <div
        className="overflow-hidden rounded-3xl p-6"
        style={{
          background: 'rgba(12,31,48,0.9)',
          border: '1px solid rgba(73,152,214,0.15)',
        }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
            style={{
              background: currentGroup.color ? `${currentGroup.color}22` : 'rgba(73,152,214,0.12)',
              border: `1px solid ${currentGroup.color ? `${currentGroup.color}44` : 'rgba(73,152,214,0.25)'}`,
            }}
          >
            {currentGroup.icon || '⭐'}
          </div>

          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: '#cfe2f9' }}>
              {currentGroup.name}
            </h1>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: 'rgba(136,189,242,0.55)' }}
              >
                <Users className="h-3.5 w-3.5" />
                {currentGroup.members?.length || 0} members
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                style={{ background: 'rgba(73,152,214,0.15)', color: '#88bdf2' }}
              >
                {currentGroup.type || 'custom'}
              </span>
            </div>
          </div>

          {/* Action icons row */}
          <div className="flex items-center gap-4 mt-1">
            {[
              { icon: Download, label: 'Export' },
              { icon: Share2,   label: 'Share' },
              { icon: MessageCircle, label: 'Chat', onClick: () => setActiveTab('chat') },
              { icon: Settings, label: 'Settings', onClick: () => setActiveTab('settings') },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-1.5 transition-all hover:scale-110"
                style={{ color: 'rgba(136,189,242,0.6)' }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(73,152,214,0.1)', border: '1px solid rgba(73,152,214,0.2)' }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs — Splitkaro style pill tabs */}
      <div
        className="flex rounded-2xl p-1.5 gap-1"
        style={{ background: 'rgba(12,31,48,0.9)', border: '1px solid rgba(73,152,214,0.12)' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200"
              style={isActive ? {
                background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
                color: '#04121e',
                boxShadow: '0 4px 12px rgba(73,152,214,0.3)',
              } : {
                color: 'rgba(136,189,242,0.5)',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'expenses' && (
          <div className="space-y-3">
            {expensesLoading ? (
              <div
                className="flex h-40 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(12,31,48,0.7)' }}
              >
                <div
                  className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
                  style={{ borderColor: 'rgba(73,152,214,0.3)', borderTopColor: '#4998d6' }}
                />
              </div>
            ) : expenses.length === 0 ? (
              /* Empty state matching Splitkaro screenshot */
              <div
                className="flex flex-col items-center justify-center rounded-3xl p-10 text-center"
                style={{ background: 'rgba(12,31,48,0.7)', border: '1px solid rgba(73,152,214,0.1)' }}
              >
                <div className="text-6xl mb-4">📋</div>
                <h3 className="font-display text-lg font-bold" style={{ color: '#cfe2f9' }}>
                  No expenses yet
                </h3>
                <p className="mt-2 max-w-xs text-sm" style={{ color: 'rgba(136,189,242,0.5)' }}>
                  Add an expense to start tracking what you owe or are owed.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
                    color: '#04121e',
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Your First Expense
                </button>
                <p className="mt-2 text-xs" style={{ color: 'rgba(136,189,242,0.35)' }}>
                  (Friends will be added automatically)
                </p>
              </div>
            ) : (
              expenses.map((expense) => {
                const emoji = CATEGORY_EMOJI[expense.category] || '💸';
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all hover:scale-[1.01]"
                    style={{ background: 'rgba(12,31,48,0.9)', border: '1px solid rgba(73,152,214,0.1)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ background: 'rgba(73,152,214,0.1)' }}
                      >
                        {emoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold" style={{ color: '#cfe2f9' }}>
                          {expense.title}
                        </h4>
                        <p className="text-xs" style={{ color: 'rgba(136,189,242,0.5)' }}>
                          Paid by {expense.paid_by_name} • {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display font-bold text-sm" style={{ color: '#cfe2f9' }}>
                        ₹{parseFloat(expense.amount).toLocaleString('en-IN')}
                      </div>
                      <div
                        className="text-[9px] uppercase font-semibold mt-0.5"
                        style={{ color: 'rgba(136,189,242,0.45)' }}
                      >
                        {expense.split_type}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'balances' && <BalanceSheet groupId={groupId} />}

        {activeTab === 'chat' && (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: 'rgba(12,31,48,0.9)', border: '1px dashed var(--sp-border-strong)' }}
          >
            <MessageCircle className="mx-auto h-8 w-8 mb-3 opacity-50" style={{ color: 'var(--sp-accent)' }} />
            <h3 className="font-display text-lg font-bold" style={{ color: '#cfe2f9' }}>
              Group Chat
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'rgba(136,189,242,0.5)' }}>
              Discuss expenses and send payment reminders. Chat functionality coming soon!
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div
            className="rounded-3xl p-8"
            style={{ background: 'rgba(12,31,48,0.9)', border: '1px solid rgba(73,152,214,0.12)' }}
          >
            <h3 className="font-display text-lg font-bold" style={{ color: '#cfe2f9' }}>
              Group Settings
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'rgba(136,189,242,0.5)' }}>
              Settings configuration coming soon.
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Expense Button */}
      <button
        onClick={() => setIsAddExpenseOpen(true)}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 lg:hidden"
        style={{
          background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
          boxShadow: '0 8px 32px -8px rgba(73,152,214,0.6)',
        }}
      >
        <Plus className="h-6 w-6" style={{ color: '#04121e' }} />
      </button>

      {/* Desktop Add button */}
      <div className="hidden lg:flex justify-end">
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
            color: '#04121e',
            boxShadow: '0 8px 24px -8px rgba(73,152,214,0.5)',
          }}
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {isAddExpenseOpen && (
        <AddGroupExpenseSheet
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          group={currentGroup}
        />
      )}
    </div>
  );
}
