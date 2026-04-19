'use client';

import { useState, useCallback } from 'react';

export function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBudget = async (budgetData) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgetData),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save budget');
    }
    
    await fetchBudgets();
  };

  const deleteBudget = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/budgets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete budget');
    }
    
    // Optimistic update
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  return {
    budgets,
    loading,
    fetchBudgets,
    saveBudget,
    deleteBudget,
  };
}
