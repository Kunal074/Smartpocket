'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Save token
      localStorage.setItem('token', data.token);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-strong w-full max-w-md rounded-3xl p-8 sm:p-10">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">Create account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to start tracking your expenses across all devices.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-border bg-input/50 py-3 pl-10 pr-4 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-input/50 py-3 pl-10 pr-4 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-input/50 py-3 pl-10 pr-4 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Sign up <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
