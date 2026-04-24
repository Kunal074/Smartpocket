'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListChecks,
  PiggyBank,
  Repeat,
  Sparkles,
  Settings as SettingsIcon,
  Wallet,
  Users,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/expenses',   label: 'Expenses',   icon: ListChecks },
  { href: '/dashboard/budgets',    label: 'Budgets',    icon: PiggyBank },
  { href: '/dashboard/groups',     label: 'SmartSplit', icon: Users },
  { href: '/dashboard/recurring',  label: 'Recurring',  icon: Repeat },
  { href: '/dashboard/insights',   label: 'Insights',   icon: Sparkles },
  { href: '/dashboard/settings',   label: 'Settings',   icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex"
      style={{
        background: 'linear-gradient(180deg, #04121e 0%, #04121e 100%)',
        borderRight: '1px solid rgba(73,152,214,0.12)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-6 py-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-glow"
          style={{ background: 'linear-gradient(135deg, #4998d6 0%, #88bdf2 100%)' }}
        >
          <Wallet className="h-5 w-5" style={{ color: '#04121e' }} />
        </div>
        <div>
          <span className="font-display text-base font-bold tracking-tight" style={{ color: '#cfe2f9' }}>
            SmartPocket
          </span>
          <p className="text-[10px] font-medium" style={{ color: '#4998d6' }}>Finance Tracker</p>
        </div>
      </Link>

      {/* Divider */}
      <div className="mx-4 mb-3 h-px" style={{ background: 'rgba(73,152,214,0.12)' }} />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(73,152,214,0.2) 0%, rgba(73,152,214,0.08) 100%)',
                color: '#88bdf2',
                borderLeft: '2px solid #4998d6',
              } : {
                color: 'rgba(136,189,242,0.55)',
                borderLeft: '2px solid transparent',
              }}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom card */}
      <div className="px-4 pb-5">
        <div
          className="rounded-2xl p-4 text-xs"
          style={{
            background: 'linear-gradient(135deg, rgba(73,152,214,0.12) 0%, rgba(34,79,113,0.2) 100%)',
            border: '1px solid rgba(73,152,214,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="font-semibold" style={{ color: '#88bdf2' }}>Connected</p>
          </div>
          <p style={{ color: 'rgba(136,189,242,0.55)' }}>
            Data synced across all your devices.
          </p>
        </div>
      </div>
    </aside>
  );
}
