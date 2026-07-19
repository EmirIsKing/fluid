'use client';

import { useState, useEffect } from 'react';
import { useParticle } from '@/components/ParticleProvider';
import WalletConnectModal from '@/components/WalletConnectModal';
import Link from 'next/link';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected, address } = useParticle();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav style={{ background: 'rgba(10,10,15,0.8)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
        className="fixed top-0 left-0 w-full z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }} className="font-bold text-xl tracking-tight">Fluid</span>
            <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
              className="text-xs font-medium px-2 py-0.5 rounded-full">Beta</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" style={{ color: 'var(--text-muted)' }} className="text-sm hover:text-white transition-colors">Features</a>
            <a href="#chains" style={{ color: 'var(--text-muted)' }} className="text-sm hover:text-white transition-colors">Chains</a>
            <a href="/overview" style={{ color: 'var(--text-muted)' }} className="text-sm hover:text-white transition-colors">Dashboard</a>
            
            {mounted && isConnected ? (
              <Link
                href="/overview"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium hover:border-[var(--accent)] transition-all"
              >
                <span style={{ background: 'var(--accent)' }} className="w-2 h-2 rounded-full inline-block animate-pulse" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </Link>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="btn-accent px-5 py-2 text-sm disabled:opacity-50"
                disabled={!mounted}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
      <WalletConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
