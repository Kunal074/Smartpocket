'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Moon, Plus, Sun } from 'lucide-react';

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

  // Sync theme with document element
  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      setTheme('dark');
    }
  };

  const currentTitle = TITLE_MAP[pathname] || 'SmartPocket';

  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/40 text-muted-foreground transition hover:text-foreground lg:hidden"
            aria-label="Home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {currentTitle}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/40 text-muted-foreground transition hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onAddClick}
            className="hidden items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 sm:inline-flex"
          >
            <Plus className="h-4 w-4" /> Add expense
          </button>
        </div>
      </div>
    </header>
  );
}
