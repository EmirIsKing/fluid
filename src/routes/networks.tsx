'use client';

import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Radio, Wifi, WifiOff } from 'lucide-react';
import { useParticle } from '@/components/ParticleProvider';
import { SUPPORTED_CHAINS } from '@shared/chains';

export const head = () => ({
  title: 'Fluid — Supported Networks',
  meta: [
    { name: 'description', content: 'Destination chains supported for cross-chain Universal Account payments.' },
    { property: 'og:title', content: 'Fluid — Supported Layers' },
    { property: 'og:description', content: 'Send to Base, Ethereum, Arbitrum, BNB Chain, and X Layer from any Primary Asset.' },
  ],
});

type NetworkMeta = {
  key: string;
  name: string;
  dotColor: string;
  liquidity: string;
  latency: number;
  type: string;
  status: 'Operational' | 'Degraded';
};

const NETWORK_META: Record<string, NetworkMeta> = {
  Ethereum:     { key: 'Ethereum',     name: 'Ethereum',     dotColor: 'bg-blue-500',   liquidity: '$14.2M', latency: 45, type: 'L1 Chain',  status: 'Operational' },
  Base:         { key: 'Base',         name: 'Base',         dotColor: 'bg-indigo-600', liquidity: '$8.9M',  latency: 8,  type: 'L2 Rollup', status: 'Operational' },
  'Arbitrum One': { key: 'Arbitrum One', name: 'Arbitrum One', dotColor: 'bg-sky-500',  liquidity: '$5.4M',  latency: 12, type: 'L2 Rollup', status: 'Operational' },
  'BNB Chain':  { key: 'BNB Chain',    name: 'BNB Chain',    dotColor: 'bg-yellow-500', liquidity: '$3.8M', latency: 20, type: 'L1 Chain',  status: 'Operational' },
  'X Layer':    { key: 'X Layer',      name: 'X Layer',      dotColor: 'bg-purple-500', liquidity: '$0.9M', latency: 18, type: 'L2 Rollup', status: 'Operational' },
};

const ALL_SUPPORTED = SUPPORTED_CHAINS.map(c => c.label);

export default function Networks() {
  const { isConnected, activeChains } = useParticle();

  const initialEnabled = useMemo(() => {
    const map: Record<string, boolean> = {};
    ALL_SUPPORTED.forEach(k => { map[k] = isConnected && activeChains.includes(k); });
    return map;
  }, [isConnected, activeChains]);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialEnabled);

  const handleToggle = (key: string) => {
    setEnabled(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Universal Routing Nodes</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
            Supported Chains. <span className="text-[var(--muted)] italic">Where recipients can receive funds.</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs bg-[var(--card)] border border-[var(--border)] rounded-full px-3.5 py-1.5 font-medium">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            <span>{ALL_SUPPORTED.length} destination chains</span>
          </div>
          <div className={`flex items-center gap-2 text-xs rounded-full px-3.5 py-1.5 font-medium border ${
            isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)]'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isConnected ? `${activeChains.length} chains with balance` : 'Wallet disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ALL_SUPPORTED.map(key => {
          const meta = NETWORK_META[key];
          const on = enabled[key] ?? false;
          const isLive = isConnected && activeChains.includes(key);
          return (
            <div
              key={key}
              className={`bg-[var(--card)] border rounded-[var(--radius)] p-5 shadow-soft transition-all duration-200 flex flex-col justify-between min-h-[220px] ${
                on ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted-foreground)] font-mono">{meta.type}</span>
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                    meta.status === 'Operational' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {meta.status === 'Operational' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {meta.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  <h3 className="font-serif text-xl font-bold text-[var(--foreground)]">{meta.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md">
                    <div className="text-[var(--muted-foreground)] mb-0.5">Liquidity</div>
                    <div className="font-semibold">{meta.liquidity}</div>
                  </div>
                  <div className="p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md">
                    <div className="text-[var(--muted-foreground)] mb-0.5">Est. Latency</div>
                    <div className="font-semibold">{meta.latency}s</div>
                  </div>
                </div>
                {isLive && (
                  <p className="text-[10px] text-emerald-500 font-semibold">Primary Assets detected on this chain</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleToggle(key)}
                className={`mt-4 w-full py-2 rounded-md text-xs font-semibold border transition-all ${
                  on
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {on ? 'Routing enabled' : 'Routing disabled'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--muted-foreground)]">
        {enabledCount} of {ALL_SUPPORTED.length} destination chains enabled for routing preview.
        Particle selects source assets automatically from your unified balance.
      </p>
    </div>
  );
}
