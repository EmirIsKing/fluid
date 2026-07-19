'use client';

import { useState, useEffect } from 'react';
import WalletConnectModal from '@/components/WalletConnectModal';
import { useParticle } from '@/components/ParticleProvider';
import { SUPPORTED_CHAINS } from '@shared/chains';

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useParticle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CHAINS = SUPPORTED_CHAINS.map(c => c.label);
  const FEATURES = [
    { icon: '⚡', title: 'One Balance', desc: 'See all your assets unified across every chain.' },
    { icon: '🔁', title: 'No Bridge UI', desc: 'Particle settles cross-chain behind the scenes — you never swap or bridge yourself.' },
    { icon: '⛽', title: 'Gas Abstracted', desc: 'Never manage gas tokens. We handle it all.' },
    { icon: '🔑', title: 'Same Wallet', desc: 'Keep your MetaMask address. No migration needed.' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(0,212,170,0.12) 0%, transparent 60%)' }}
            className="absolute inset-0" />
          <div style={{ background: 'radial-gradient(ellipse at 80% 80%, rgba(124,58,237,0.08) 0%, transparent 50%)' }}
            className="absolute inset-0" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Powered by Particle Network Universal Accounts · EIP-7702
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
            <span className="text-white">Send crypto to</span><br />
            <span className="gradient-text">anyone. Any chain.</span>
          </h1>

          <p style={{ color: 'var(--text-subtle)' }} className="text-xl sm:text-2xl font-light mb-10 max-w-2xl mx-auto leading-relaxed">
            One wallet. One balance. No bridges. No network switching.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {mounted && isConnected ? (
              <a href="/overview" className="btn-accent px-10 py-4 text-lg">
                Open Dashboard →
              </a>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="btn-accent px-10 py-4 text-lg disabled:opacity-50"
                disabled={!mounted}
              >
                Connect Wallet
              </button>
            )}
            <a href="#features" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              className="px-10 py-4 text-lg rounded-full hover:border-[var(--accent)] hover:text-white transition-all">
              See How It Works
            </a>
          </div>

          {/* Mini demo card */}
          <div className="mx-auto max-w-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24 }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-left">
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">You send</p>
                  <p className="text-2xl font-bold">0.025 ETH <span style={{ color: 'var(--text-muted)' }} className="text-sm font-normal">Base</span></p>
                </div>
                <div style={{ color: 'var(--accent)' }} className="text-2xl">→</div>
                <div className="text-right">
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">Bob gets</p>
                  <p className="text-2xl font-bold">50 USDC <span style={{ color: 'var(--text-muted)' }} className="text-sm font-normal">Base</span></p>
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12 }} className="p-3 text-center">
                <p style={{ color: 'var(--accent)' }} className="text-xs font-semibold">✦ Particle auto-routes from your balance</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">No swap UI · No bridge UI · 1 signature</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p style={{ color: 'var(--accent)' }} className="text-center text-sm font-semibold uppercase tracking-widest mb-4">Why Fluid</p>
          <h2 className="text-4xl font-bold text-center mb-16">Crypto payments, finally simple</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card hover:border-[var(--accent)] transition-colors">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chains strip */}
      <section id="chains" className="py-16 px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-8">Send to any of these chains — automatically</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {CHAINS.map(chain => (
              <div key={chain} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                className="px-5 py-2.5 rounded-full text-sm font-medium">
                {chain}
              </div>
            ))}
          </div>
        </div>
      </section>

      <WalletConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
