import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useGroupExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('You must be logged in to do this');
      return null;
    }
    
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  // Fetch group expenses
  const fetchExpenses = useCallback(async (groupId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/api/groups/${groupId}/expenses`);
      if (data) setExpenses(data);
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch group expenses');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Fetch settlements
  const fetchSettlements = useCallback(async (groupId) => {
    setIsLoading(true);
    try {
      const data = await apiCall(`/api/settlements?groupId=${groupId}`);
      if (data) setSettlements(data);
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch settlements');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Add a group expense
  const addExpense = async (groupId, expenseData) => {
    setIsLoading(true);
    try {
      const result = await apiCall(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      if (result?.expense) {
        // Optimistic UI update
        const newExpenseWithFallback = {
          ...result.expense,
          // Fallback UI fields since we don't have joined user data locally
          paid_by_name: 'You', 
        };
        setExpenses(prev => [newExpenseWithFallback, ...prev]);
        toast.success('Expense added successfully');
        return result;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Record a settlement (UPI payment)
  const addSettlement = async (settlementData) => {
    setIsLoading(true);
    try {
      const newSettlement = await apiCall('/api/settlements', {
        method: 'POST',
        body: JSON.stringify(settlementData),
      });
      if (newSettlement) {
        setSettlements(prev => [newSettlement, ...prev]);
        toast.success('Settlement recorded successfully');
        return newSettlement;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record settlement');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a group expense
  const deleteExpense = async (expenseId) => {
    setIsLoading(true);
    try {
      await apiCall(`/api/group-expenses/${expenseId}`, {
        method: 'DELETE',
      });
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast.success('Expense deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expenses,
    settlements,
    isLoading,
    error,
    fetchExpenses,
    fetchSettlements,
    addExpense,
    addSettlement,
    deleteExpense,
  };
}
