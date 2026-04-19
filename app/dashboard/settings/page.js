'use client';

import { LogOut, Save, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const isGuest = true; // Temporary for MVP, will use real auth state later

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved');
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
                Your data is saved locally. Create an account to sync your expenses across all your devices and ensure you never lose your data.
              </p>
              <button className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
                Sign up now
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
                defaultValue="Guest User"
                className="mt-1 w-full rounded-xl border border-border bg-input/50 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
              <input
                type="email"
                disabled
                placeholder="Not provided in Guest Mode"
                className="mt-1 w-full rounded-xl border border-border bg-input/20 px-4 py-2.5 text-sm text-muted-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Currency</label>
              <input
                type="text"
                disabled
                defaultValue="INR (₹)"
                className="mt-1 w-full rounded-xl border border-border bg-input/20 px-4 py-2.5 text-sm text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      </form>

      {!isGuest && (
        <div className="flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
