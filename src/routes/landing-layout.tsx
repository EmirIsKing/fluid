'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Sun, Moon, Wallet } from 'lucide-react';
import { useParticle } from '@/components/ParticleProvider';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const { isConnected, address, connect } = useParticle();

  useEffect(() => {
    const savedTheme = localStorage.getItem('fluid_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fluid_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fluid_theme', 'light');
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[140px] animate-flare-1" />
        <div className="absolute bottom-[10%] left-[-10%] w-[45vw] h-[45vw] bg-fuchsia-500/8 dark:bg-fuchsia-500/4 rounded-full blur-[120px] animate-flare-2" />
        <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-emerald-500/5 rounded-full blur-[100px] animate-flare-1" />
      </div>

      <header className="relative z-20 sticky top-0 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <NextLink href="/" className="flex items-center gap-2 group shrink-0">
            <span className="w-8 h-8 rounded-[var(--radius)] bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-mono font-bold text-lg group-hover:scale-105 transition-transform">
              F
            </span>
            <span className="font-semibold text-lg tracking-tight">Fluid</span>
          </NextLink>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Features
            </a>
            <a href="#networks" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Networks
            </a>
            <a href="#how-it-works" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2.5 ml-auto md:ml-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isConnected && address ? (
              <NextLink
                href="/overview"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold tracking-wider hover:opacity-90 shadow-soft transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
                Open Dashboard
              </NextLink>
            ) : (
              <button
                onClick={() => connect('metamask')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold tracking-wider hover:opacity-90 shadow-soft transition-all active:scale-[0.98]"
              >
                <Wallet size={14} />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-mono font-bold text-xs">
              F
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              Fluid · Universal Accounts by Particle Network
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
            <NextLink href="/send" className="hover:text-[var(--foreground)] transition-colors">
              Send
            </NextLink>
            <span>No swaps · No bridges</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
