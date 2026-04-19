'use client';

import { categoryById } from '@/lib/categories';
import { formatINR } from '@/lib/format';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function CategoryDonut({ expenses = [] }) {
  if (expenses.length === 0) {
    return (
      <div className="glass flex h-[350px] flex-col items-center justify-center rounded-3xl p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50 text-2xl">
          📊
        </div>
        <p className="mt-4 font-display font-medium">No data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add expenses to see your breakdown.
        </p>
      </div>
    );
  }

  // Aggregate expenses by category
  const aggregated = expenses.reduce((acc, exp) => {
    acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
    return acc;
  }, {});

  const data = Object.entries(aggregated)
    .map(([categoryId, value]) => {
      const cat = categoryById(categoryId);
      return {
        name: cat.name,
        value,
        color: cat.color,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by highest spend

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-border/50 bg-popover/90 px-3 py-2 text-sm shadow-elevated backdrop-blur-md">
          <p className="font-medium text-popover-foreground">{payload[0].name}</p>
          <p className="font-display font-semibold tracking-tight text-primary">
            {formatINR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <h3 className="font-display text-lg font-semibold tracking-tight">
        Spend by Category
      </h3>
      <div className="mt-6 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
        {data.slice(0, 6).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
