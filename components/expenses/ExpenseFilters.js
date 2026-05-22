'use client';

import { CATEGORIES } from '@/lib/categories';
import { currentMonthKey } from '@/lib/format';
import { Funnel as Filter } from '@phosphor-icons/react';
import Select from '@/components/ui/Select';
import CategoryIcon from '@/components/ui/CategoryIcon';

export default function ExpenseFilters({ 
  filterMonth, 
  setFilterMonth, 
  filterCategory, 
  setFilterCategory 
}) {
  const monthOptions = [
    { value: 'all', label: 'All Time' },
    { value: currentMonthKey(), label: 'This Month' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...CATEGORIES.filter((c) => c.kind === 'expense').map((cat) => ({
      value: cat.id,
      label: (
        <span className="flex items-center gap-2">
          <CategoryIcon id={cat.id} className="h-4 w-4 text-muted-foreground" />
          <span>{cat.name}</span>
        </span>
      ),
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filter</span>
      </div>

      <div className="w-36">
        <Select
          value={filterMonth}
          onChange={setFilterMonth}
          options={monthOptions}
        />
      </div>

      <div className="w-48">
        <Select
          value={filterCategory}
          onChange={setFilterCategory}
          options={categoryOptions}
        />
      </div>
    </div>
  );
}
