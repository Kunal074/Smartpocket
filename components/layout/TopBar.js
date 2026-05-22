'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Plus, Sun } from '@phosphor-icons/react';

const TITLE_MAP = {
  '/dashboard': 'Dashboard',
  '/dashboard/expenses': 'Expenses',
  '/dashboard/budgets': 'Budgets',
  '/dashboard/recurring': 'Recurring',
  '/dashboard/insights': 'Insights',
  '/dashboard/settings': 'Settings',
};

export default function TopBar({ onAddClick }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');

  // Sync theme with document element on mount
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
    // Ensure dark class is not present (we use .light class to opt-in to light)
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      setTheme('dark');
    }
  };

  const currentTitle = TITLE_MAP[pathname] || 'SmartPocket';

  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl topbar-header">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl transition hover:scale-105 lg:hidden"
            aria-label="Home"
            style={{ background: 'rgba(73,152,214,0.1)', border: '1px solid rgba(73,152,214,0.2)', color: '#88bdf2' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-semibold tracking-tight" style={{ color: '#cfe2f9' }}>
            {currentTitle}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105"
            aria-label="Toggle theme"
            style={{ background: 'rgba(73,152,214,0.1)', border: '1px solid rgba(73,152,214,0.2)', color: '#88bdf2' }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onAddClick}
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-90 hover:scale-105 sm:inline-flex"
            style={{
              background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
              color: '#04121e',
              boxShadow: '0 4px 16px -4px rgba(73,152,214,0.5)',
            }}
          >
            <Plus className="h-4 w-4" /> Add expense
          </button>
        </div>
      </div>
    </header>
  );
}
