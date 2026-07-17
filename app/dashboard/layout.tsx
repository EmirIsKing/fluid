'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Send, Activity, Users, User } from 'lucide-react';
import { useParticle } from '@/components/ParticleProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const tabs = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Send, label: 'Send', path: '/dashboard/send' },
  { icon: Activity, label: 'Activity', path: '/dashboard/activity' },
  { icon: Users, label: 'Contacts', path: '/dashboard/contacts' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isConnected, isInitializing } = useParticle();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isInitializing]);

  if (isInitializing) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <div style={{ color: 'var(--text-muted)' }} className="text-sm">Loading session...</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }} className="flex flex-col md:flex-row">
      {/* Sidebar — desktop */}
      <aside style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}
        className="hidden md:flex flex-col w-64 h-screen sticky top-0 overflow-y-auto">
        <div style={{ borderBottom: '1px solid var(--border)' }} className="h-16 flex items-center px-6">
          <Link href="/" style={{ color: 'var(--accent)' }} className="font-bold text-xl">Fluid</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(tab => {
            const isActive = pathname === tab.path;
            return (
              <Link key={tab.path} href={tab.path}
                style={{
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  borderRadius: 12,
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:text-white transition-colors">
                <tab.icon size={18} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ borderTop: '1px solid var(--border)' }} className="p-4">
          <UABadge />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-3xl w-full mx-auto">
          {children}
        </div>

        {/* Bottom tab bar — mobile */}
        <nav style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}
          className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2 z-40">
          {tabs.map(tab => {
            const isActive = pathname === tab.path;
            return (
              <Link key={tab.path} href={tab.path}
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
                className="flex flex-col items-center gap-0.5 p-2 min-w-[56px]">
                <tab.icon size={20} />
                <span className="text-xs">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function UABadge() {
  const { address } = useParticle();
  return (
    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 14 }} className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ background: 'var(--accent)' }} className="w-2 h-2 rounded-full" />
        <span style={{ color: 'var(--accent)' }} className="text-xs font-bold">Universal Account</span>
      </div>
      <p style={{ color: 'var(--text-muted)' }} className="text-xs font-mono truncate">{address?.slice(0, 20)}...</p>
    </div>
  );
}
