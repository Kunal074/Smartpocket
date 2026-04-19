'use client';

import { useState, useEffect } from 'react';
import CategoryDonut from '@/components/dashboard/CategoryDonut';
import { currentMonthKey, formatINR } from '@/lib/format';

export default function InsightsPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulated fetch for MVP UI testing
  useEffect(() => {
    const dummyExpenses = [
      { id: '1', amount: 18000, categoryId: 'rent', date: new Date().toISOString() },
      { id: '2', amount: 4820, categoryId: 'groceries', date: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', amount: 1200, categoryId: 'food', date: new Date(Date.now() - 172800000).toISOString() },
      { id: '4', amount: 800, categoryId: 'transport', date: new Date(Date.now() - 259200000).toISOString() },
    ];
    setExpenses(dummyExpenses);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const thisMonthExpenses = expenses.filter(
    (exp) => new Date(exp.date).toISOString().slice(0, 7) === currentMonthKey()
  );

  const totalThisMonth = thisMonthExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Insights</h2>
        <p className="mt-1 text-muted-foreground">Analyze your spending patterns.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Spend (This Month)
          </p>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight">
            {formatINR(totalThisMonth)}
          </p>
          
          <div className="mt-8 space-y-4">
            <h4 className="font-medium">Quick Stats</h4>
            <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
              <span className="text-muted-foreground">Daily Average</span>
              <span className="font-medium">{formatINR(totalThisMonth / new Date().getDate())}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
              <span className="text-muted-foreground">Highest Spend</span>
              <span className="font-medium">
                {formatINR(Math.max(...thisMonthExpenses.map((e) => e.amount), 0))}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2 text-sm">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-medium">{thisMonthExpenses.length}</span>
            </div>
          </div>
        </div>

        <div>
          <CategoryDonut expenses={thisMonthExpenses} />
        </div>
      </div>
    </div>
  );
}
