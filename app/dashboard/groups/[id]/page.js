'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, Wallet, Receipt, Settings } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import AddGroupExpenseSheet from '@/components/groups/AddGroupExpenseSheet';
import BalanceSheet from '@/components/groups/BalanceSheet';

export default function GroupDetailPage({ params }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const groupId = unwrappedParams.id;
  
  const { currentGroup, fetchGroupDetails, isLoading: groupLoading } = useGroups();
  const { expenses, fetchExpenses, isLoading: expensesLoading } = useGroupExpenses();
  
  const [activeTab, setActiveTab] = useState('expenses'); // expenses, balances, settings
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    fetchGroupDetails(groupId);
    fetchExpenses(groupId);
  }, [groupId, fetchGroupDetails, fetchExpenses]);

  if (groupLoading && !currentGroup) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentGroup) return null;

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <Link 
        href="/dashboard/groups" 
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Groups
      </Link>

      {/* Group Header Card */}
      <div className="glass overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div 
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm sm:h-20 sm:w-20"
              style={{ backgroundColor: currentGroup.color || 'var(--primary)' }}
            >
              <span className="text-3xl sm:text-4xl">{currentGroup.icon || '⭐'}</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {currentGroup.name}
              </h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {currentGroup.members?.length || 0} members
                </span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-accent text-xs font-semibold">
                  {currentGroup.type}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-5 w-5" /> Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {[
          { id: 'expenses', label: 'Expenses', icon: Receipt },
          { id: 'balances', label: 'Balances', icon: Wallet },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {expensesLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="glass flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Receipt className="h-8 w-8" />
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">No expenses yet</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Add an expense to start tracking what you owe or are owed.
                </p>
                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/80"
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="glass flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/50 dark:hover:bg-black/20">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg">
                        {expense.category === 'food' ? '🍔' : expense.category === 'transport' ? '🚕' : '💸'}
                      </div>
                      <div>
                        <h4 className="font-semibold">{expense.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Paid by {expense.paid_by_name} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{expense.amount}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">{expense.split_type} split</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <BalanceSheet groupId={groupId} />
        )}

        {activeTab === 'settings' && (
          <div className="glass rounded-3xl p-8">
            <h3 className="font-display text-lg font-bold">Group Settings</h3>
            <p className="text-sm text-muted-foreground">Settings configuration coming soon.</p>
          </div>
        )}
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
