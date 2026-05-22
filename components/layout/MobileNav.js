'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour as LayoutDashboard,
  ListChecks,
  PiggyBank,
  Users,
  Sparkle as Sparkles,
  Plus,
} from '@phosphor-icons/react';

const NAV = [
  { href: '/dashboard',          label: 'Home',      icon: LayoutDashboard },
  { href: '/dashboard/expenses', label: 'Expenses',  icon: ListChecks },
  { href: '/dashboard/groups',   label: 'Split',     icon: Users },
  { href: '/dashboard/budgets',  label: 'Budgets',   icon: PiggyBank },
  { href: '/dashboard/insights', label: 'Insights',  icon: Sparkles },
];

export default function MobileNav({ onAddClick }) {
  const pathname = usePathname();

  return (
    <>
      {/* Floating Add Button */}
      <button
        onClick={onAddClick}
        aria-label="Add expense"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-glow transition-all duration-200 hover:scale-105 active:scale-95 lg:hidden"
        style={{
          background: 'linear-gradient(135deg, #4998d6 0%, #88bdf2 100%)',
          boxShadow: '0 8px 32px -8px rgba(73,152,214,0.55)',
        }}
      >
        <Plus className="h-6 w-6" style={{ color: '#04121e' }} />
      </button>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 lg:hidden pb-safe"
        style={{
          background: 'rgba(4, 18, 30, 0.92)',
          borderTop: '1px solid rgba(73,152,214,0.14)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold transition-all duration-200"
                style={active ? { color: '#4998d6' } : { color: 'rgba(136,189,242,0.45)' }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200"
                  style={active ? {
                    background: 'rgba(73,152,214,0.18)',
                  } : {}}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
