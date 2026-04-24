'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

import AddExpenseSheet from '@/components/expenses/AddExpenseSheet';

export default function DashboardLayout({ children }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full dashboard-bg">
      <Sidebar />
      <main className="flex min-h-screen w-full flex-1 flex-col pb-24 lg:pb-0 dashboard-bg">
        <TopBar onAddClick={() => setAddOpen(true)} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
      <MobileNav onAddClick={() => setAddOpen(true)} />
      <AddExpenseSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
