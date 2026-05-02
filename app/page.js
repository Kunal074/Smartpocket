'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  Download,
  Users
} from 'lucide-react';

export default function Landing() {
  const container = useRef(null);

  useGSAP(() => {
    // Hero Animations
    const tl = gsap.timeline();
    
    tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .from('.hero-buttons', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-features', { y: 10, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-card', { x: 40, opacity: 0, duration: 1, ease: 'power4.out' }, '-=1');

    // Scroll Animations for Features
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '#features',
        start: 'top 70%'
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.2)'
    });

  }, { scope: container });

  return (
    <div className="min-h-screen" ref={container}>
      <Header />
      <Hero />
      <Features />
      <Showcase />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            SmartPocket
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground transition">
            Features
          </a>
          <a href="#showcase" className="hover:text-foreground transition">
            Showcase
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="/SmartPocket.apk"
            download
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            <Download className="h-4 w-4" /> Download App
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="space-y-7">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for Indian wallets — ₹ first
          </div>
          <h1 className="hero-title font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Track every <span className="text-gradient">₹</span>,
            <br /> save smarter.
          </h1>
          <p className="hero-subtitle max-w-lg text-lg leading-relaxed text-muted-foreground">
            SmartPocket is a beautifully simple expense tracker. Add a chai in 3
            taps, set category budgets, and split bills seamlessly — directly from your Android phone.
          </p>
          <div className="hero-buttons flex flex-wrap items-center gap-3">
            <a
              href="/SmartPocket.apk"
              download
              className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
            >
              <Download className="h-4 w-4" /> Download Android APK
            </a>
          </div>
          <div className="hero-features flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> 100% Free & Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> Works offline
            </span>
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="hero-card relative">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
      <div className="glass-strong relative rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              This month
            </p>
            <p className="font-display text-4xl font-bold tracking-tight">
              <span className="text-muted-foreground/60">₹</span>34,580
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <PiggyBank className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full gradient-primary"
            style={{ width: '62%' }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          62% of ₹55,000 monthly budget
        </p>

        <div className="mt-6 space-y-3">
          {[
            { emoji: '🏠', name: 'Rent', amt: 18000, pct: 100, color: 'oklch(0.72 0.15 230)' },
            { emoji: '🛒', name: 'Groceries', amt: 4820, pct: 60, color: 'oklch(0.82 0.16 168)' },
            { emoji: '🍱', name: 'Food & Chai', amt: 2160, pct: 54, color: 'oklch(0.82 0.16 75)' },
            { emoji: '🚗', name: 'Transport', amt: 1340, pct: 45, color: 'oklch(0.7 0.18 295)' },
          ].map((r) => (
            <div key={r.name} className="rounded-2xl bg-accent/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="text-lg">{r.emoji}</span> {r.name}
                </span>
                <span className="font-display tabular-nums">
                  ₹{r.amt.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Zap,
      title: '3-tap entry',
      desc: 'Floating ₹ button → amount → category. Done. Add an expense in under 3 seconds.',
    },
    {
      icon: Users,
      title: 'SmartSplit',
      desc: 'Going on a trip or living with roommates? Split bills seamlessly without awkward math.',
    },
    {
      icon: Bell,
      title: 'Smart alerts',
      desc: 'Get notified the moment a budget hits 80%. No surprises at month-end.',
    },
    {
      icon: PiggyBank,
      title: 'Recurring bills',
      desc: 'Rent, EMI, Netflix — set it once and SmartPocket logs it every cycle.',
    },
    {
      icon: ShieldCheck,
      title: 'Privacy-first',
      desc: 'Your data is secured with bank-grade encryption and OTP verifications.',
    },
    {
      icon: Sparkles,
      title: 'Made for India',
      desc: '₹ INR first, Indian categories, Indian number formatting (lakhs & crores).',
    },
  ];
  return (
    <section id="features" className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need.{' '}
            <span className="text-muted-foreground">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A clean, focused expense tracker that makes saving feel effortless.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="feature-card glass group rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {it.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section id="showcase" className="border-t border-border/40 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="glass-strong rounded-3xl p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Today&apos;s spend
          </p>
          <p className="font-display text-5xl font-bold tracking-tight">
            <span className="text-muted-foreground/60">₹</span>720
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Mini emoji="🛒" label="Groceries" amt={540} />
            <Mini emoji="🍱" label="Chai" amt={180} />
          </div>
          <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-warning">
              <Bell className="h-4 w-4" /> Food & Chai is at 80% of budget
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ₹3,200 of ₹4,000 used — 8 days left in the month.
            </p>
          </div>
        </div>
        <div className="space-y-5">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Budgets that <span className="text-gradient">actually work</span>.
          </h2>
          <p className="text-muted-foreground">
            Set a monthly cap per category. SmartPocket nudges you gently at 80%
            and warns clearly at 100% — so you stay on track without thinking
            about it.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              'Per-category monthly limits',
              'Visual progress rings',
              'In-app alerts at 80% & 100%',
              'Roll-overs to next month',
            ].map((x) => (
              <li key={x} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  ✓
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Mini({ emoji, label, amt }) {
  return (
    <div className="rounded-2xl bg-accent/40 p-4">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums">
        ₹{amt.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function CTA() {
  return (
    <section className="border-t border-border/40 px-4 py-24 sm:px-6">
      <div className="glass-strong mx-auto max-w-4xl rounded-3xl p-10 text-center sm:p-14 shadow-2xl">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Start tracking in <span className="text-gradient">10 seconds</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Download the Android app today. No credit card required.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/SmartPocket.apk"
            download
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 hover:scale-105"
          >
            <Download className="h-5 w-5" /> Download SmartPocket APK
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 text-center text-xs text-muted-foreground">
      <p>© {new Date().getFullYear()} SmartPocket — Made with ❤️ in India</p>
    </footer>
  );
}
