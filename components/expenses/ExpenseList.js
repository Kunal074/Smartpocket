'use client';

import { categoryById } from '@/lib/categories';
import { formatINR, monthKey } from '@/lib/format';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseList({ expenses, filterMonth, filterCategory }) {
  // Apply filters
  const filtered = expenses.filter((exp) => {
    if (filterMonth !== 'all' && monthKey(exp.date) !== filterMonth) return false;
    if (filterCategory !== 'all' && exp.categoryId !== filterCategory) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="glass mt-6 flex flex-col items-center justify-center rounded-3xl p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50 text-3xl">
          🍃
        </div>
        <p className="mt-4 font-display text-lg font-medium tracking-tight">
          No expenses found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try changing your filters or add a new expense.
        </p>
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      // In Phase 8 we will wire this up to the DELETE API endpoint
      // For now, simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Expense deleted successfully!');
      // Typically, trigger a refetch here or optimistic update
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {filtered.map((exp) => {
        const cat = categoryById(exp.categoryId);
        const dateObj = new Date(exp.date);
        
        return (
          <div
            key={exp.id}
            className="group flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition hover:bg-accent/30 hover:shadow-soft"
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner"
                style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 15%, transparent)` }}
              >
                {cat.emoji}
              </div>
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {dateObj.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {exp.note ? ` • ${exp.note}` : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <p className="font-display text-lg font-semibold tabular-nums">
                {formatINR(exp.amount)}
              </p>
              <button
                onClick={() => handleDelete(exp.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 lg:opacity-100"
                aria-label="Delete expense"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
