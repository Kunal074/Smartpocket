'use client';

import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupSheet from '@/components/groups/CreateGroupSheet';

export default function GroupsPage() {
  const { groups, fetchGroups, isLoading } = useGroups();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">SmartSplit</h2>
          <p className="mt-1 text-muted-foreground">Split bills and manage group expenses.</p>
        </div>
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Group
        </button>
      </div>

      {/* Groups Grid */}
      {isLoading && groups.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="glass flex flex-col items-center justify-center rounded-3xl p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold">No groups yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create your first group to start splitting bills with friends, roommates, or coworkers.
          </p>
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/80"
          >
            Create a Group
          </button>
        </div>
      )}

      {/* Slide-over sheet for creating a group */}
      {isCreateSheetOpen && (
        <CreateGroupSheet 
          isOpen={isCreateSheetOpen} 
          onClose={() => setIsCreateSheetOpen(false)} 
        />
      )}
    </div>
  );
}
