'use client';

import { categoryById } from '@/lib/categories';
import { formatINR } from '@/lib/format';

export default function RecentTransactions({ expenses = [] }) {
  if (expenses.length === 0) {
    return (
      <div className="glass rounded-3xl p-6 sm:p-8">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Recent Expenses
        </h3>
        <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/50 text-2xl">
            🍃
          </div>
          <p className="mt-4 text-sm font-medium">No expenses yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap the + button to add your first expense.
          </p>
        </div>
      </div>
    );
  }

  // Show only top 5 recent expenses
  const recent = expenses.slice(0, 5);

  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Recent Expenses
        </h3>
      </div>

      <div className="mt-6 space-y-4">
        {recent.map((exp) => {
          const cat = categoryById(exp.categoryId);
          const dateObj = new Date(exp.date);
          const isToday = new Date().toDateString() === dateObj.toDateString();
          
          const dateStr = isToday
            ? 'Today'
            : dateObj.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              });

          return (
            <div
              key={exp.id}
              className="group flex items-center justify-between rounded-2xl p-2 transition hover:bg-accent/40"
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm"
                  style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 15%, transparent)` }}
                >
                  {cat.emoji}
                </div>
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr} {exp.note ? `• ${exp.note}` : ''}
                  </p>
                </div>
              </div>
              <p className="font-display font-semibold tabular-nums">
                {formatINR(exp.amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
