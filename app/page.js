'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { toast } from 'sonner';
import {
  ArrowRight,
  ChartBar,
  Bell,
  PiggyBank,
  ShieldCheck,
  Sparkle,
  Wallet,
  Lightning,
  DownloadSimple,
  Users,
  House,
  ShoppingCart,
  Coffee,
  Car,
  InstagramLogo,
  LinkedinLogo,
  Envelope
} from '@phosphor-icons/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Landing() {
  const container = useRef(null);
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoStart = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    const toastId = toast.loading('Initializing custom sandbox demo...');
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start demo');
      }

      localStorage.setItem('token', data.token);
      toast.success('Welcome to SmartPocket Sandbox!', { id: toastId });
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Something went wrong', { id: toastId });
      setDemoLoading(false);
    }
  };

  useGSAP(() => {
    // Hero Animations
    const tl = gsap.timeline();
    
    tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .from('.hero-buttons', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-features', { y: 10, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .from('.hero-card', { x: 40, opacity: 0, duration: 1, ease: 'power4.out' }, '-=1');

    // Showcase Section Animation
    gsap.from('#showcase > div > div', {
      scrollTrigger: {
        trigger: '#showcase',
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });

    // CTA Section Animation
    gsap.from('#cta-container', {
      scrollTrigger: {
        trigger: '#cta-container',
        start: 'top 80%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

  }, { scope: container });

  return (
    <div className="min-h-screen" ref={container}>
      <Header onDemoStart={handleDemoStart} demoLoading={demoLoading} />
      <Hero onDemoStart={handleDemoStart} demoLoading={demoLoading} />
      <Features />
      <Screenshots />
      <Showcase />
      <CTA onDemoStart={handleDemoStart} demoLoading={demoLoading} />
      <Footer />
    </div>
  );
}

function Header({ onDemoStart, demoLoading }) {
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
          <a href="#screenshots" className="hover:text-foreground transition">
            Showcase
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDemoStart}
            disabled={demoLoading}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors mr-2 disabled:opacity-50"
          >
            ✨ Try Demo
          </button>
          <a
            href="/SmartPocket.apk"
            download
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            <DownloadSimple className="h-4 w-4" /> Download App
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ onDemoStart, demoLoading }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="space-y-7">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkle className="h-3.5 w-3.5 text-primary" />
            Built for Indian wallets — ₹ first
          </div>
          <h1 className="hero-title font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Track every <span className="text-gradient">₹</span>,
            <br /> save smarter.
          </h1>
          <p className="hero-subtitle max-w-lg text-lg leading-relaxed text-muted-foreground">
            SmartPocket is a beautifully simple expense tracker. Add a chai in 3
            taps, set category budgets, and split bills seamlessly — directly in your browser or Android phone.
          </p>
          <div className="hero-buttons flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDemoStart}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 hover:scale-105 disabled:opacity-50"
            >
              ✨ Try Live Demo
            </button>
            <a
              href="/SmartPocket.apk"
              download
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent/60 hover:scale-105"
            >
              <DownloadSimple className="h-4 w-4" /> Download APK
            </a>
          </div>
          <div className="hero-features flex items-center gap-6 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> 100% Free & Secure
            </span>
            <span className="flex items-center gap-1.5">
              <Lightning className="h-4 w-4 text-primary" /> Works offline
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
            { icon: House, name: 'Rent', amt: 18000, pct: 100, color: 'oklch(0.72 0.15 230)' },
            { icon: ShoppingCart, name: 'Groceries', amt: 4820, pct: 60, color: 'oklch(0.82 0.16 168)' },
            { icon: Coffee, name: 'Food & Chai', amt: 2160, pct: 54, color: 'oklch(0.82 0.16 75)' },
            { icon: Car, name: 'Transport', amt: 1340, pct: 45, color: 'oklch(0.7 0.18 295)' },
          ].map((r) => (
            <div key={r.name} className="rounded-2xl bg-accent/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="h-4 w-4" />
                  </span>
                  {r.name}
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
      icon: Lightning,
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
      icon: Sparkle,
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

function Screenshots() {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    const children = Array.from(container.children);
    let itemIndex = 0;
    
    children.forEach((child) => {
      // Ignore the style tag which is also a child
      if (child.tagName === 'STYLE') return;
      
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const distance = Math.abs(containerCenter - childCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = itemIndex;
      }
      itemIndex++;
    });
    
    setActiveIndex(closestIndex);
  };

  useEffect(() => {
    // Initial calculation
    handleScroll();
  }, []);

  const screens = [
    {
      id: 'home',
      src: '/Screenshots/Screenshot_home.png',
      title: 'Home Dashboard',
      desc: 'Get a clear overview of your monthly spending, active budgets, and quick actions.'
    },
    {
      id: 'add',
      src: '/Screenshots/Screenshot_Add_Expense.png',
      title: 'Quick Add',
      desc: 'Log your daily expenses in under 3 seconds with our streamlined entry flow.'
    },
    {
      id: 'analytics',
      src: '/Screenshots/Screenshot_Analytics.png',
      title: 'Deep Analytics',
      desc: 'Visualize your spending habits across categories to make smarter financial decisions.'
    },
    {
      id: 'split',
      src: '/Screenshots/Screenshot_Smart_split_tab.png',
      title: 'Smart Split',
      desc: 'Managing shared expenses with roommates or trip buddies has never been easier.'
    },
    {
      id: 'group',
      src: '/Screenshots/Screenshot_Group.png',
      title: 'Group Details',
      desc: 'Track who paid what and settle up instantly without any awkward math.'
    },
    {
      id: 'budget',
      src: '/Screenshots/Screenshot_add_budget.png',
      title: 'Set Budgets',
      desc: 'Create category-wise monthly limits and get notified before you overspend.'
    },
    {
      id: 'arena',
      src: '/Screenshots/Screenshot_Arena.png',
      title: 'Financial Arena',
      desc: 'Gamify your savings and challenge yourself to achieve your financial goals.'
    }
  ];

  return (
    <section id="screenshots" className="border-t border-border/40 py-12 bg-card/10 overflow-hidden flex flex-col justify-center min-h-[100vh]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            See it in <span className="text-gradient">Action</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A sneak peek into the SmartPocket app experience.
          </p>
        </div>
      </div>
        
      {/* Horizontal scroll container for screenshots - FULL WIDTH */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-8 flex gap-6 overflow-x-auto pb-8 pt-6 snap-x snap-mandatory px-[calc(50vw-110px)] sm:px-[calc(50vw-120px)] custom-scrollbar w-full"
      >
        {screens.map((screen, index) => {
          const isActive = index === activeIndex;
          return (
            <div 
              key={screen.id} 
              className={`flex flex-col items-center gap-4 shrink-0 snap-center w-[220px] sm:w-[240px] transition-all duration-500 ease-out ${
                isActive ? 'scale-105 opacity-100 z-10' : 'scale-90 opacity-40 blur-[2px] -z-10'
              }`}
            >
              <div className={`relative overflow-hidden rounded-[2rem] border-[6px] bg-background shadow-2xl h-[460px] sm:h-[500px] w-full transition-colors duration-500 ${
                isActive ? 'border-primary/50' : 'border-border'
              }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={screen.src} 
                  alt={screen.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`text-center px-2 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                <h3 className="font-display text-lg font-bold text-foreground">{screen.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{screen.desc}</p>
              </div>
            </div>
          );
        })}
        
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
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
            <Mini icon={ShoppingCart} label="Groceries" amt={540} />
            <Mini icon={Coffee} label="Chai" amt={180} />
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

function Mini({ icon: Icon, label, amt }) {
  return (
    <div className="rounded-2xl bg-accent/40 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums">
        ₹{amt.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function CTA({ onDemoStart, demoLoading }) {
  return (
    <section id="cta-container" className="border-t border-border/40 px-4 py-24 sm:px-6">
      <div className="glass-strong mx-auto max-w-4xl rounded-3xl p-10 text-center sm:p-14 shadow-2xl">
        <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Start tracking in <span className="text-gradient">10 seconds</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Try our interactive sandbox demo instantly or download the Android app today. No signup required.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onDemoStart}
            disabled={demoLoading}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 hover:scale-105 disabled:opacity-50"
          >
            ✨ Try Sandbox Demo
          </button>
          <a
            href="/SmartPocket.apk"
            download
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent/60 hover:scale-105"
          >
            <DownloadSimple className="h-5 w-5" /> Download APK
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-12 text-center text-xs text-muted-foreground">
      <div className="flex flex-wrap justify-center items-center gap-6 mb-6">
        <a 
          href="https://instagram.com/k.unal_sahu___" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-foreground transition-colors flex items-center gap-2 text-sm"
        >
          <InstagramLogo className="h-5 w-5 text-pink-500" />
          <span className="font-medium">k.unal_sahu___</span>
        </a>
        <a 
          href="https://linkedin.com/in/kunal074" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-foreground transition-colors flex items-center gap-2 text-sm"
        >
          <LinkedinLogo className="h-5 w-5 text-blue-500" />
          <span className="font-medium">kunal074</span>
        </a>
        <a 
          href="mailto:kunalsahu232777@gmail.com" 
          className="hover:text-foreground transition-colors flex items-center gap-2 text-sm"
        >
          <Envelope className="h-5 w-5 text-emerald-500" />
          <span className="font-medium">kunalsahu232777@gmail.com</span>
        </a>
      </div>
      <p>© {new Date().getFullYear()} SmartPocket — Made with ❤️ in India</p>
    </footer>
  );
}
