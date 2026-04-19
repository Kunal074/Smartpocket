'use client';

import { CATEGORIES } from '@/lib/categories';
import { currentMonthKey } from '@/lib/format';
import { Filter } from 'lucide-react';

export default function ExpenseFilters({ 
  filterMonth, 
  setFilterMonth, 
  filterCategory, 
  setFilterCategory 
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filter</span>
      </div>

      <select
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-accent/40 focus:border-primary focus:outline-none"
      >
        <option value="all">All Time</option>
        <option value={currentMonthKey()}>This Month</option>
        {/* We can dynamically generate more months based on actual data later */}
      </select>

      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:bg-accent/40 focus:border-primary focus:outline-none"
      >
        <option value="all">All Categories</option>
        {CATEGORIES.filter((c) => c.kind === 'expense').map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
