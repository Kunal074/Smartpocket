'use client';

import { useState, useCallback } from 'react';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = async (expenseData) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add expense');
    }
    
    await fetchExpenses();
  };

  const deleteExpense = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete expense');
    }
    
    // Optimistic update
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    deleteExpense,
  };
}
