'use client';

import { useEffect, useState } from 'react';
import { Plus, Users, MagnifyingGlass as Search } from '@phosphor-icons/react';
import { useGroups } from '@/hooks/useGroups';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupSheet from '@/components/groups/CreateGroupSheet';

export default function GroupsPage() {
  const { groups, fetchGroups, isLoading } = useGroups();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold tracking-tight"
            style={{ color: '#cfe2f9' }}
          >
            SmartSplit
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: 'rgba(136,189,242,0.55)' }}>
            Split bills and manage group expenses
          </p>
        </div>
        <button
          onClick={() => setIsCreateSheetOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
            color: '#04121e',
            boxShadow: '0 8px 24px -8px rgba(73,152,214,0.5)',
          }}
        >
          <Plus className="h-4 w-4" /> New Group
        </button>
      </div>

      {/* Search bar */}
      {groups.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'rgba(12,31,48,0.9)',
            border: '1px solid rgba(73,152,214,0.15)',
          }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: '#4998d6' }} />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder-opacity-50"
            style={{ color: '#cfe2f9' }}
          />
        </div>
      )}

      {/* Groups Grid */}
      {isLoading && groups.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: 'rgba(73,152,214,0.3)', borderTopColor: '#4998d6' }}
          />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center rounded-3xl p-12 text-center"
          style={{
            background: 'rgba(12,31,48,0.7)',
            border: '1px dashed rgba(73,152,214,0.25)',
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
            style={{ background: 'rgba(73,152,214,0.1)' }}
          >
            <Users className="h-8 w-8" style={{ color: '#4998d6' }} />
          </div>
          <h3 className="font-display text-lg font-bold" style={{ color: '#cfe2f9' }}>
            No groups yet
          </h3>
          <p className="mt-2 max-w-xs text-sm" style={{ color: 'rgba(136,189,242,0.5)' }}>
            Create your first group to split bills with friends, roommates, or coworkers.
          </p>
          <button
            onClick={() => setIsCreateSheetOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #4998d6 0%, #3572a2 100%)',
              color: '#04121e',
            }}
          >
            <Plus className="h-4 w-4" /> Create a Group
          </button>
        </div>
      ) : (
        /* No search results */
        <div className="flex h-32 items-center justify-center rounded-2xl" style={{ background: 'rgba(12,31,48,0.6)' }}>
          <p className="text-sm" style={{ color: 'rgba(136,189,242,0.5)' }}>
            No groups match "{search}"
          </p>
        </div>
      )}

      {isCreateSheetOpen && (
        <CreateGroupSheet
          isOpen={isCreateSheetOpen}
          onClose={() => setIsCreateSheetOpen(false)}
        />
      )}
    </div>
  );
}
