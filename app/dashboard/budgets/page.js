'use client';

import { useState, useEffect } from 'react';
import BudgetCard from '@/components/budgets/BudgetCard';
import { currentMonthKey } from '@/lib/format';
import { CATEGORIES } from '@/lib/categories';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for adding a new budget inline
  const [showAdd, setShowAdd] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newLimit, setNewLimit] = useState('');

  // Simulated fetch for MVP UI testing
  useEffect(() => {
    const dummyBudgets = [
      { id: '1', categoryId: 'rent', limit: 18000, month: currentMonthKey() },
      { id: '2', categoryId: 'groceries', limit: 8000, month: currentMonthKey() },
      { id: '3', categoryId: 'food', limit: 4000, month: currentMonthKey() },
    ];
    
    const dummyExpenses = [
      { id: '1', amount: 18000, categoryId: 'rent', date: new Date().toISOString() },
      { id: '2', amount: 4820, categoryId: 'groceries', date: new Date().toISOString() },
      { id: '3', amount: 1200, categoryId: 'food', date: new Date().toISOString() },
    ];

    setBudgets(dummyBudgets);
    setExpenses(dummyExpenses);
    setLoading(false);
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryId || !newLimit || Number(newLimit) <= 0) {
      toast.error('Please enter valid category and limit');
      return;
    }

    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 500));
      
      const newBudget = {
        id: Date.now().toString(),
        categoryId: newCategoryId,
        limit: Number(newLimit),
        month: currentMonthKey(),
      };
      
      setBudgets([...budgets.filter(b => b.categoryId !== newCategoryId), newBudget]);
      setShowAdd(false);
      setNewCategoryId('');
      setNewLimit('');
      toast.success('Budget saved successfully');
    } catch (err) {
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return;
    try {
      await new Promise(r => setTimeout(r, 500));
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success('Budget removed');
    } catch (err) {
      toast.error('Failed to remove budget');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Calculate spend per category for the current month
  const spendByCategory = expenses.reduce((acc, exp) => {
    if (exp.month === currentMonthKey() || new Date(exp.date).toISOString().slice(0,7) === currentMonthKey()) {
      acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
    }
    return acc;
  }, {});

  // Available categories to add (those not already budgeted)
  const budgetedCategoryIds = budgets.map(b => b.categoryId);
  const availableCategories = CATEGORIES.filter(c => c.kind === 'expense' && !budgetedCategoryIds.includes(c.id));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Monthly Budgets</h2>
          <p className="mt-1 text-muted-foreground">Set limits to stay on track.</p>
        </div>
        
        {availableCategories.length > 0 && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" /> New Budget
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAddSubmit} className="glass rounded-3xl p-6 sm:p-8">
          <h3 className="font-display text-lg font-semibold">Create Budget</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <select
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>Select Category</option>
              {availableCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
              ))}
            </select>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="Monthly Limit"
                className="w-full rounded-xl border border-border bg-input/50 py-3 pl-8 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold hover:bg-accent/80"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {budgets.length === 0 && !showAdd ? (
        <div className="glass flex flex-col items-center justify-center rounded-3xl p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/50 text-3xl">
            🎯
          </div>
          <p className="mt-4 font-display text-lg font-medium tracking-tight">No budgets set</p>
          <p className="mt-1 text-sm text-muted-foreground">Set category limits to control your spending.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spend={spendByCategory[budget.categoryId] || 0}
              onDelete={handleDelete}
              onEdit={(b) => {
                setNewCategoryId(b.categoryId);
                setNewLimit(b.limit.toString());
                setShowAdd(true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
