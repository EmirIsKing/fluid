'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUpRight } from 'lucide-react';
import { Link } from './router-mock';
import { useParticle } from '@/components/ParticleProvider';
import { STABLE_ASSETS } from '@shared/chains';
import { getAssetUsdPrice } from '@shared/particle-utils';
import { SUPPORTED_CHAINS } from '@shared/chains';

export const head = () => ({
  title: 'Fluid — Balances',
  meta: [
    { name: 'description', content: 'View unified Primary Asset balances across supported EVM networks.' },
    { property: 'og:title', content: 'Fluid — Unified Balances' },
    { property: 'og:description', content: 'Review token holdings on Base, Ethereum, Arbitrum, BNB Chain, and X Layer.' },
  ],
});

type SortField = 'token' | 'network' | 'balance' | 'valueUsd';

type BalanceRow = {
  id: string;
  token: string;
  symbol: string;
  network: string;
  balance: number;
  valueUsd: number;
  price: number;
  dotColor: string;
  type: 'stable' | 'native';
};

const DOT_COLORS = Object.fromEntries(SUPPORTED_CHAINS.map(c => [c.label, c.dotColor]));

function primaryAssetsToRows(assets: ReturnType<typeof useParticle>['primaryAssets']): BalanceRow[] {
  return assets.map((asset, i) => {
    const balance = parseFloat(asset.amount) || 0;
    const valueUsd = parseFloat(asset.amountInUSD) || 0;
    const price = getAssetUsdPrice(asset);
    const isStable = STABLE_ASSETS.has(asset.symbol as 'USDC' | 'USDT');
    return {
      id: `bal-${asset.chainId}-${asset.symbol}-${i}`,
      token: asset.symbol,
      symbol: asset.symbol,
      network: asset.chainName,
      balance,
      valueUsd,
      price,
      dotColor: DOT_COLORS[asset.chainName] ?? 'bg-slate-400',
      type: isStable ? 'stable' : 'native',
    };
  });
}

/** Tiny inline sparkline — SVG path based on index within result set. */
function Sparkline({ index, positive }: { index: number; positive: boolean }) {
  const path = [
    'M0,15 Q10,12 20,18 T40,8 T60,14 T80,5 T100,2',
    'M0,18 Q10,14 20,16 T40,10 T60,12 T80,6 T100,4',
    'M0,19 Q10,16 20,10 T40,15 T60,7 T80,3 T100,1',
    'M0,14 Q10,10 20,12 T40,8 T60,10 T80,4 T100,3',
    'M0,12 Q10,9  20,14 T40,9 T60,6  T80,8 T100,2',
  ][index % 5];
  return (
    <svg className="w-16 h-6 overflow-visible" viewBox="0 0 100 20">
      <path d={path} fill="none" stroke={positive ? 'oklch(0.62 0.14 165)' : 'oklch(0.63 0.15 20)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Balances() {
  const { isConnected, balance, primaryAssets } = useParticle();

  const [filter, setFilter] = useState<'all' | 'stable' | 'native'>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('valueUsd');
  const [sortAsc, setSortAsc] = useState(false);

  const rows = useMemo(() => primaryAssetsToRows(primaryAssets), [primaryAssets]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    return rows
      .filter(r => {
        const matchFilter = filter === 'all' || r.type === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || r.token.toLowerCase().includes(q) || r.symbol.toLowerCase().includes(q) || r.network.toLowerCase().includes(q);
        return matchFilter && matchSearch;
      })
      .sort((a, b) => {
        const va = a[sortField], vb = b[sortField];
        if (typeof va === 'string' && typeof vb === 'string')
          return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        if (typeof va === 'number' && typeof vb === 'number')
          return sortAsc ? va - vb : vb - va;
        return 0;
      });
  }, [rows, filter, search, sortField, sortAsc]);

  const stableTotal = useMemo(() => rows.filter(r => r.type === 'stable').reduce((s, r) => s + r.valueUsd, 0), [rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Asset Balances</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
          Unified Assets. <span className="text-[var(--muted)] italic">Across all active layers.</span>
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft relative overflow-hidden">
        <div className="absolute inset-0 grid-paper pointer-events-none opacity-40" />
        <div className="space-y-1.5 relative z-10">
          <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Unified Balance</div>
          <div className="text-3xl font-serif font-bold text-[var(--foreground)]">
            {isConnected ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
        </div>
        <div className="space-y-1.5 relative z-10 border-t sm:border-t-0 sm:border-x border-[var(--border)] pt-4 sm:pt-0 sm:px-6">
          <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Stablecoin Holdings</div>
          <div className="text-3xl font-serif font-bold text-[var(--foreground)]">
            {isConnected ? `$${stableTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
        </div>
        <div className="space-y-1.5 relative z-10 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Primary Assets</div>
          <div className="text-3xl font-serif font-bold text-[var(--accent)]">
            {isConnected ? rows.length : '—'}
          </div>
        </div>
      </div>

      {/* Table panel */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-soft overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-[var(--background)] border border-[var(--border)] rounded-lg p-0.5 text-xs shrink-0 self-start">
            {(['all', 'native', 'stable'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all capitalize ${
                  filter === f ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}>
                {f === 'all' ? 'All Assets' : f === 'native' ? 'Native' : 'Stablecoins'}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={14} />
            <input type="text" placeholder="Search assets, network…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--muted)]" />
          </div>
        </div>

        {/* Table */}
        {!isConnected ? (
          <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
            Connect your wallet to view asset balances.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
            {rows.length === 0 ? 'No Primary Assets on your Universal Account yet.' : 'No assets match your filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="px-6 py-4 cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('token')}>
                    <div className="flex items-center gap-1">Asset <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('network')}>
                    <div className="flex items-center gap-1">Network <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('balance')}>
                    <div className="flex items-center justify-end gap-1">Balance <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('valueUsd')}>
                    <div className="flex items-center justify-end gap-1">USD Value <ArrowUpDown size={10} /></div>
                  </th>
                  <th className="px-6 py-4 text-center">Trend</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map((row, i) => (
                  <tr key={row.id} className="hover:bg-[var(--border)]/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${row.dotColor}`} />
                        <div>
                          <div className="font-semibold text-[var(--foreground)]">{row.token}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{row.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded-md">{row.network}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs whitespace-nowrap">
                      ${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs whitespace-nowrap">
                      {row.balance.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs font-semibold whitespace-nowrap text-[var(--foreground)]">
                      ${row.valueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2">
                        <Sparkline index={i} positive />
                        <span className="text-[10px] font-bold text-emerald-500">Live</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link to="/send"
                        className="p-1.5 rounded-md bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] text-[var(--muted-foreground)] transition-all inline-flex"
                        title="Send">
                        <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
