import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupBalances, setGroupBalances] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper for API calls
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

  // Fetch all groups for the user
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/groups');
      if (data) setGroups(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Fetch a single group's details
  const fetchGroupDetails = useCallback(async (groupId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/api/groups/${groupId}`);
      if (data) setCurrentGroup(data);
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch group details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Fetch group balances and simplified debts
  const fetchGroupBalances = useCallback(async (groupId) => {
    setIsLoading(true);
    try {
      const data = await apiCall(`/api/groups/${groupId}/balances`);
      if (data) setGroupBalances(data);
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch balances');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Create a new group
  const createGroup = async (groupData) => {
    setIsLoading(true);
    try {
      const newGroup = await apiCall('/api/groups', {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
      if (newGroup) {
        setGroups(prev => [newGroup, ...prev]);
        toast.success('Group created successfully');
        return newGroup;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a group
  const updateGroup = async (groupId, updateData) => {
    setIsLoading(true);
    try {
      const updated = await apiCall(`/api/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      if (updated) {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updated } : g));
        if (currentGroup?.id === groupId) {
          setCurrentGroup(prev => ({ ...prev, ...updated }));
        }
        toast.success('Group updated successfully');
        return updated;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a member to a group
  const addMember = async (groupId, email) => {
    setIsLoading(true);
    try {
      await apiCall(`/api/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Member added successfully');
      // Refresh current group to get new members
      await fetchGroupDetails(groupId);
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    groups,
    currentGroup,
    groupBalances,
    isLoading,
    error,
    fetchGroups,
    fetchGroupDetails,
    fetchGroupBalances,
    createGroup,
    updateGroup,
    addMember,
  };
}
