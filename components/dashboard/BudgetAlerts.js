'use client';

import { categoryById } from '@/lib/categories';
import { formatINR } from '@/lib/format';
import { Bell, Warning as AlertTriangle } from '@phosphor-icons/react';

export default function BudgetAlerts({ expenses = [], budgets = [] }) {
  if (budgets.length === 0) return null;

  // Calculate spend per category
  const spendByCategory = expenses.reduce((acc, exp) => {
    acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
    return acc;
  }, {});

  // Find alerts (>= 80% usage)
  const alerts = budgets
    .map((budget) => {
      const spend = spendByCategory[budget.categoryId] || 0;
      const percentage = (spend / budget.limit) * 100;
      return { ...budget, spend, percentage };
    })
    .filter((b) => b.percentage >= 80)
    .sort((a, b) => b.percentage - a.percentage);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const cat = categoryById(alert.categoryId);
        const isExceeded = alert.percentage >= 100;

        return (
          <div
            key={alert.id}
            className={`flex gap-3 rounded-2xl border p-4 ${
              isExceeded
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-warning/30 bg-warning/10 text-warning'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isExceeded ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">
                {cat.name} is {isExceeded ? 'over budget' : 'almost out of budget'}
              </p>
              <p className="mt-1 text-sm opacity-80">
                {formatINR(alert.spend)} of {formatINR(alert.limit)} used (
                {alert.percentage.toFixed(0)}%).
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
