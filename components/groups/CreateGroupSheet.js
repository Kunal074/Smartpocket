'use client';

import { useState } from 'react';
import { X, Users, Plane, Home, Briefcase, Heart, Star } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const GROUP_TYPES = [
  { id: 'trip', label: 'Trip', icon: Plane, emoji: '✈️', color: '#14b8a6' },
  { id: 'home', label: 'Home', icon: Home, emoji: '🏠', color: '#f97316' },
  { id: 'office', label: 'Office', icon: Briefcase, emoji: '💼', color: '#3b82f6' },
  { id: 'couple', label: 'Couple', icon: Heart, emoji: '💑', color: '#ec4899' },
  { id: 'custom', label: 'Custom', icon: Star, emoji: '⭐', color: '#8b5cf6' },
];

export default function CreateGroupSheet({ isOpen, onClose }) {
  const { createGroup, isLoading } = useGroups();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState(GROUP_TYPES[4]); // Custom default

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createGroup({
        name,
        description,
        type: selectedType.id,
        icon: selectedType.emoji,
        color: selectedType.color,
      });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all duration-100"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border/50 bg-background/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Users className="h-5 w-5 text-primary" /> Create Group
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex h-[calc(100vh-8rem)] flex-col justify-between">
          <div className="space-y-6">
            
            {/* Group Type Selector */}
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Group Type</label>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {GROUP_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType.id === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 text-primary shadow-glow shadow-primary/20' 
                          : 'border-border bg-input/20 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Group Name</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goa Trip 2026"
                className="mt-1.5 w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-input/50 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary/80">
              <p>💡 You will be added as an Admin automatically. You can invite friends to this group after creating it.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="mt-auto w-full rounded-xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </>
  );
}
