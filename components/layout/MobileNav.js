'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Repeat,
  Sparkles,
  Plus,
  Users,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/expenses', label: 'Expenses', icon: ListChecks },
  { href: '/dashboard/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/dashboard/groups', label: 'SmartSplit', icon: Users },
  { href: '/dashboard/insights', label: 'Insights', icon: Sparkles },
];

export default function MobileNav({ onAddClick }) {
  const pathname = usePathname();

  // Mobile nav usually only shows the first 5 items to fit the screen
  const items = NAV.slice(0, 5);

  return (
    <>
      <button
        onClick={onAddClick}
        aria-label="Add expense"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-glow transition hover:scale-105 active:scale-95 lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
      
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-background/85 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
