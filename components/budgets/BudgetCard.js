'use client';

import { categoryById } from '@/lib/categories';
import { formatINR } from '@/lib/format';
import RingProgress from './RingProgress';
import { Pencil as Edit2, Trash as Trash2 } from '@phosphor-icons/react';
import CategoryIcon from '@/components/ui/CategoryIcon';

export default function BudgetCard({ budget, spend = 0, onEdit, onDelete }) {
  const cat = categoryById(budget.categoryId);
  const percentage = (spend / budget.limit) * 100;
  
  let progressColor = 'var(--primary)';
  if (percentage >= 100) progressColor = 'var(--destructive)';
  else if (percentage >= 80) progressColor = 'var(--warning)';

  const isExceeded = percentage >= 100;

  return (
    <div className="glass group relative overflow-hidden rounded-3xl p-6 transition-all hover:shadow-elevated sm:p-8">
      {/* Background glow if exceeded */}
      {isExceeded && (
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-destructive/10 blur-3xl" />
      )}

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner text-primary"
            style={{ 
              backgroundColor: `color-mix(in oklab, ${cat.color} 15%, transparent)`,
              color: cat.color
            }}
          >
            <CategoryIcon id={cat.id} className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {cat.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Limit: {formatINR(budget.limit)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 lg:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(budget)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Edit budget"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(budget.id)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Delete budget"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Spend
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold tracking-tight">
              {formatINR(spend)}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {isExceeded ? (
              <span className="text-destructive">
                {formatINR(spend - budget.limit)} over budget
              </span>
            ) : (
              <span className={percentage >= 80 ? 'text-warning' : 'text-primary'}>
                {formatINR(budget.limit - spend)} left
              </span>
            )}
          </p>
        </div>

        <RingProgress
          percentage={percentage}
          color={progressColor}
          size={84}
          strokeWidth={7}
        />
      </div>
    </div>
  );
}
