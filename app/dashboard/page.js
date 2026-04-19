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
          <RecentTransactions expenses={expenses} />
        </div>
      </div>
    </div>
  );
}
