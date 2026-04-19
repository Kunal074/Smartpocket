'use client';

import { PiggyBank } from 'lucide-react';
import { formatINR } from '@/lib/format';

export default function SpendCard({ 
  totalSpend = 0, 
  budgetLimit = 0, 
  title = "This month" 
}) {
  const isBudgetSet = budgetLimit > 0;
  const percentage = isBudgetSet ? Math.min((totalSpend / budgetLimit) * 100, 100) : 0;

  // Change color based on percentage
  let progressColor = 'var(--primary)';
  if (percentage >= 100) progressColor = 'var(--destructive)';
  else if (percentage >= 80) progressColor = 'var(--warning)';

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-8">
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-muted-foreground/60">₹</span>
            <span className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {formatINR(totalSpend).replace('₹', '')}
            </span>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-inner sm:h-14 sm:w-14">
          <PiggyBank className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
        </div>
      </div>

      {isBudgetSet ? (
        <div className="relative mt-8">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">
              {percentage.toFixed(0)}% of {formatINR(budgetLimit)}
            </span>
            <span className={percentage >= 100 ? 'text-destructive' : percentage >= 80 ? 'text-warning' : 'text-primary'}>
              {formatINR(Math.max(budgetLimit - totalSpend, 0))} left
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${percentage}%`,
                backgroundColor: progressColor,
                boxShadow: `0 0 10px ${progressColor}40`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="inline-block rounded-xl bg-accent/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            No budget set for this month
          </div>
        </div>
      )}
    </div>
  );
}
