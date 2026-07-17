'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Coins, 
  ArrowDownLeft, 
  Send as SendIcon, 
  Network, 
  Settings as SettingsIcon,
  Sun, 
  Moon, 
  Bell, 
  Search,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { Link, Outlet } from './router-mock';
import { useParticle } from '@/components/ParticleProvider';

const sidebarItems = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/balances', label: 'Balances', icon: Coins },
  { to: '/inbound', label: 'Inbound', icon: ArrowDownLeft },
  { to: '/send', label: 'Send', icon: SendIcon },
  { to: '/networks', label: 'Networks', icon: Network },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { isConnected, address, connect, disconnect, transactions } = useParticle();

  // Initialize theme from localStorage
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
    <div className={`relative min-h-screen flex flex-col md:flex-row bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200 z-10 ${darkMode ? 'dark' : ''}`}>
      {/* Drifting Background Flares */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[140px] animate-flare-1" />
        <div className="absolute bottom-[10%] left-[-10%] w-[45vw] h-[45vw] bg-fuchsia-500/8 dark:bg-fuchsia-500/4 rounded-full blur-[120px] animate-flare-2" />
      </div>

      {/* Left Sidebar */}
      <aside className="relative z-10 w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0 md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        {/* Logo Section */}
        <div className="h-16 px-6 border-b border-[var(--border)] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-[var(--radius)] bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-mono font-bold text-lg group-hover:scale-105 transition-transform">
              F
            </span>
            <span className="font-semibold text-lg tracking-tight font-sans">Fluid</span>
          </Link>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)] text-[var(--muted-foreground)]">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sidebarItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)] shadow-soft font-medium"
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-[var(--radius)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all group duration-150"
            >
              <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-105" />
              <span>{item.label}</span>
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </Link>
          ))}
        </nav>

        {/* Bottom Wallet connection state */}
        <div className="p-4 border-t border-[var(--border)]">
          {isConnected && address ? (
            <div className="p-3.5 bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] relative group overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-dot m-2" />
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1">
                Connected Address
              </div>
              <div className="font-mono text-xs truncate select-all text-[var(--foreground)] mb-2">
                {address}
              </div>
              <button 
                onClick={disconnect}
                className="w-full py-1 text-[10px] font-bold text-center tracking-wider text-rose-500 hover:text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-md transition-colors"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <button 
              onClick={() => connect('metamask')}
              className="w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold tracking-wider hover:opacity-90 shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Wallet size={14} />
              CONNECT WALLET
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-6 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between sticky top-0 z-20">
          {/* Search bar */}
          <div className="relative max-w-xs w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
            <input 
              type="text" 
              placeholder="Search transactions, networks..."
              className="w-full pl-9 pr-12 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--muted)]"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--card)] border border-[var(--border)] text-[10px] text-[var(--muted-foreground)] px-1.5 py-0.5 rounded font-mono select-none">
              ⌘K
            </kbd>
          </div>
          <div className="sm:hidden font-semibold tracking-tight text-md">
            Dashboard
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            {/* Dark mode switcher */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors duration-150 relative"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors duration-150"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-dot" />
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-glow p-4 z-50">
                  <h3 className="font-semibold text-sm mb-3">Recent Notifications</h3>
                  {isConnected ? (
                    transactions.length > 0 ? (
                      <div className="space-y-2.5">
                        {transactions.slice(0, 3).map(tx => (
                          <div key={tx.id} className="p-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs">
                            <div className="font-semibold mb-0.5">
                              {tx.type === 'received' ? '↓ Inbound received' : '↑ Payment sent'}
                            </div>
                            <div className="text-[var(--muted-foreground)] font-mono">
                              {tx.amount} {tx.asset} on {tx.chain} · {tx.date}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted-foreground)] italic">No transactions yet.</p>
                    )
                  ) : (
                    <p className="text-xs text-[var(--muted-foreground)] italic">Connect wallet to see notifications.</p>
                  )}
                </div>
              )}
            </div>

            {/* Avatar Cluster */}
            <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
              <div className="w-8 h-8 rounded-full border border-[var(--border)] bg-[var(--accent-dim)] flex items-center justify-center text-xs font-semibold text-[var(--accent)] font-mono">
                {isConnected && address ? address.slice(2, 4).toUpperCase() : '?'}
              </div>
              {isConnected && address && (
                <span className="text-sm font-medium hidden md:inline text-[var(--foreground)] font-mono">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
