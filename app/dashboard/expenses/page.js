'use client';

import { useState, useEffect } from 'react';
import ExpenseFilters from '@/components/expenses/ExpenseFilters';
import ExpenseList from '@/components/expenses/ExpenseList';

export default function ExpensesPage() {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulated fetch for MVP UI testing
  useEffect(() => {
    const dummyExpenses = [
      { id: '1', amount: 18000, categoryId: 'rent', date: new Date().toISOString(), note: 'May Rent' },
      { id: '2', amount: 4820, categoryId: 'groceries', date: new Date(Date.now() - 86400000).toISOString(), note: 'Blinkit' },
      { id: '3', amount: 1200, categoryId: 'food', date: new Date(Date.now() - 172800000).toISOString(), note: 'Zomato' },
      { id: '4', amount: 800, categoryId: 'transport', date: new Date(Date.now() - 259200000).toISOString(), note: 'Uber' },
      { id: '5', amount: 450, categoryId: 'entertainment', date: new Date(Date.now() - 345600000).toISOString(), note: 'Netflix' },
    ];
    setExpenses(dummyExpenses);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-3xl font-bold tracking-tight">All Expenses</h2>
      </div>

      <ExpenseFilters 
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
      />

      <ExpenseList 
        expenses={expenses}
        filterMonth={filterMonth}
        filterCategory={filterCategory}
      />
    </div>
  );
}
