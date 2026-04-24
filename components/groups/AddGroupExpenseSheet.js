'use client';

import { useState } from 'react';
import { X, Receipt } from 'lucide-react';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';

export default function AddGroupExpenseSheet({ isOpen, onClose, group }) {
  const { addExpense, isLoading } = useGroupExpenses();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('equal'); // equal, percentage, custom
  
  // Array of members with specific overrides
  // member state shape: { user_id, percentage, amount, isIncluded }
  const [memberSplits, setMemberSplits] = useState(
    group?.members?.map(m => ({
      user_id: m.user_id,
      name: m.name,
      percentage: '',
      amount: '',
      isIncluded: true
    })) || []
  );

  const handleMemberChange = (userId, field, value) => {
    setMemberSplits(prev => prev.map(m => 
      m.user_id === userId ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    // Filter to only included members
    const activeMembers = memberSplits.filter(m => m.isIncluded);
    
    // Validate custom/percentage before sending
    if (splitType === 'percentage') {
      const sum = activeMembers.reduce((acc, m) => acc + (parseFloat(m.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        alert('Percentages must sum exactly to 100%');
        return;
      }
    } else if (splitType === 'custom') {
      const sum = activeMembers.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      if (Math.abs(sum - parseFloat(amount)) > 0.01) {
        alert('Custom amounts must sum exactly to the total amount');
        return;
      }
    }

    try {
      await addExpense(group.id, {
        title,
        amount: parseFloat(amount),
        category: 'other',
        split_type: splitType,
        members: activeMembers.map(m => ({
          user_id: m.user_id,
          percentage: splitType === 'percentage' ? parseFloat(m.percentage) : undefined,
          amount: splitType === 'custom' ? parseFloat(m.amount) : undefined
        }))
      });
      onClose();
    } catch (error) {
      // hook handles toast
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-border/50 bg-background/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Receipt className="h-5 w-5 text-primary" /> Add Expense
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 pb-20">
          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">What was this for?</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Olive"
              className="mt-1 w-full rounded-xl border border-border bg-input/50 px-4 py-3 focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Amount</label>
            <div className="relative mt-1 flex items-center">
              <span className="absolute left-4 text-xl font-medium text-muted-foreground">₹</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-border bg-input/50 py-4 pl-10 pr-4 text-2xl font-bold tracking-tight focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase text-muted-foreground">Split Type</label>
            <div className="mt-2 flex rounded-xl border border-border bg-input/20 p-1">
              {['equal', 'percentage', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all ${
                    splitType === type ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium uppercase text-muted-foreground">Members Involved</label>
            <div className="rounded-2xl border border-border bg-input/10 p-2">
              {memberSplits.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={m.isIncluded}
                      onChange={(e) => handleMemberChange(m.user_id, 'isIncluded', e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className={`text-sm font-medium ${!m.isIncluded && 'text-muted-foreground line-through'}`}>
                      {m.name}
                    </span>
                  </div>
                  
                  {m.isIncluded && splitType === 'percentage' && (
                    <div className="relative w-20">
                      <input 
                        type="number" 
                        value={m.percentage}
                        onChange={(e) => handleMemberChange(m.user_id, 'percentage', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 pr-6 text-right text-sm"
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                    </div>
                  )}

                  {m.isIncluded && splitType === 'custom' && (
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">₹</span>
                      <input 
                        type="number" 
                        value={m.amount}
                        onChange={(e) => handleMemberChange(m.user_id, 'amount', e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-1 pl-6 pr-2 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {m.isIncluded && splitType === 'equal' && (
                    <span className="text-xs text-muted-foreground">
                      Included
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !title || !amount}
            className="w-full rounded-xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </>
  );
}
