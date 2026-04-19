'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { X, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddExpenseSheet({ open, onOpenChange }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Close when overlay is clicked
  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // In Phase 8 we will wire this up to our API. 
      // For now, simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success('Expense added successfully!');
      setAmount('');
      setNote('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border bg-background p-6 shadow-2xl transition-transform sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Add Expense
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 hover:bg-accent/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase text-muted-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground/60">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-border bg-input/50 py-4 pl-10 pr-4 font-display text-3xl font-bold transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="space-y-3">
            <label className="text-xs font-medium uppercase text-muted-foreground">Category</label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {CATEGORIES.filter(c => c.kind === 'expense').map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                      isSelected 
                        ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                        : 'border-border bg-card hover:bg-accent/40'
                    }`}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-[10px] font-medium sm:text-xs text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input/50 py-3 pl-10 pr-3 text-sm transition focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Note (Optional)</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Starbucks"
                  className="w-full rounded-xl border border-border bg-input/50 py-3 pl-10 pr-3 text-sm transition focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl gradient-primary py-4 text-base font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
