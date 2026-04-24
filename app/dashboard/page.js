'use client';

import { useState, useEffect } from 'react';
import SpendCard from '@/components/dashboard/SpendCard';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import CategoryDonut from '@/components/dashboard/CategoryDonut';
import BudgetAlerts from '@/components/dashboard/BudgetAlerts';
import { currentMonthKey } from '@/lib/format';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // In Phase 8 we will hook this up to the real DB via fetch.
  // For now, in MVP Guest Mode, we use dummy data to verify UI
  useEffect(() => {
    // Simulated data fetch
    const dummyExpenses = [
      { id: '1', amount: 18000, categoryId: 'rent', date: new Date().toISOString(), note: 'May Rent' },
      { id: '2', amount: 4820, categoryId: 'groceries', date: new Date(Date.now() - 86400000).toISOString(), note: 'Blinkit' },
      { id: '3', amount: 1200, categoryId: 'food', date: new Date(Date.now() - 172800000).toISOString(), note: 'Zomato' },
      { id: '4', amount: 800, categoryId: 'transport', date: new Date(Date.now() - 259200000).toISOString(), note: 'Uber' }
    ];
    
    const dummyBudgets = [
      { id: '1', categoryId: 'rent', limit: 18000, month: currentMonthKey() },
      { id: '2', categoryId: 'groceries', limit: 8000, month: currentMonthKey() },
      { id: '3', categoryId: 'food', limit: 4000, month: currentMonthKey() },
    ];

    setExpenses(dummyExpenses);
    setBudgets(dummyBudgets);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Calculate totals for the current month
  const totalSpend = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalBudget = budgets.reduce((acc, b) => acc + b.limit, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <SpendCard totalSpend={totalSpend} budgetLimit={totalBudget} title="This Month" />
          <BudgetAlerts expenses={expenses} budgets={budgets} />
        </div>
        <div className="md:col-span-4">
          <CategoryDonut expenses={expenses} />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-12">
          {/* SmartSplit Promo Banner */}
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8 relative overflow-hidden group transition-all hover:border-primary/40">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 text-primary/10 transition-transform group-hover:scale-110">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight text-foreground relative z-10">
              New: SmartSplit ✨
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground relative z-10">
              Split bills seamlessly with your friends, roommates, and colleagues. Keep track of group trips and automatically calculate who owes what with the Minimum Cash Flow algorithm.
            </p>
            <div className="mt-6 relative z-10">
              <a href="/dashboard/groups" className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90">
                Try SmartSplit Now
              </a>
            </div>
          </div>

          <RecentTransactions expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
