'use client';

import { useState, useEffect } from 'react';
import { LogOut, Save, Shield, User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUpiId(user.upi_id || '');
    }
  }, [user]);

  const isGuest = !user;

  const handleSave = async (e) => {
    e.preventDefault();
    if (isGuest) {
      toast.success('Settings saved locally in guest mode');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, upi_id: upiId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      toast.success('Profile updated successfully');
      // The useAuth hook will eventually re-fetch me if we add a refresh method, 
      // but for now local state is updated.
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {isGuest && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-primary">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">You are in Guest Mode</p>
              <p className="mt-1 text-sm opacity-80">
                Sign in to manage your profile and start splitting expenses with friends.
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                Sign in now
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <User className="h-5 w-5 text-primary" /> Profile
          </h3>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                disabled={isGuest}
                className="mt-1 w-full rounded-xl border border-border bg-input/50 px-4 py-2.5 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                placeholder={isGuest ? "Not provided in Guest Mode" : ""}
                className="mt-1 w-full rounded-xl border border-border bg-input/20 px-4 py-2.5 text-sm text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="pt-4 pb-2">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold border-t border-border/50 pt-6">
                <Wallet className="h-5 w-5 text-primary" /> Payment details
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Required for SmartSplit. This is how friends will pay you back.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. rahul@okicici"
                disabled={isGuest}
                className="mt-1 w-full rounded-xl border border-border bg-input/50 px-4 py-2.5 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isGuest}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {!isGuest && (
        <div className="flex justify-end">
          <button 
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
