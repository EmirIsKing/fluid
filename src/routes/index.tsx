'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  TrendingUp,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useParticle, type Transaction } from '@/components/ParticleProvider';
import { resolveChainConfig } from '@shared/chains';

export const head = () => ({
  title: 'Fluid — One address for every network',
  meta: [
    { name: 'description', content: 'Receive crypto on any network using a single universal deposit address.' },
    { property: 'og:title', content: 'Fluid — One address for every network' },
    { property: 'og:description', content: 'Send to any chain from any asset you hold — no swapping or bridging required.' },
  ],
});

const networksList = [
  { id: 'all',      name: 'All networks', color: 'bg-emerald-500' },
  { id: 'ethereum', name: 'Ethereum',     color: 'bg-blue-500'    },
  { id: 'base',     name: 'Base',         color: 'bg-indigo-600'  },
  { id: 'arbitrum', name: 'Arbitrum',     color: 'bg-sky-500'     },
  { id: 'bnb',      name: 'BNB Chain',    color: 'bg-yellow-500'  },
  { id: 'xlayer',   name: 'X Layer',      color: 'bg-purple-500'  },
];

/** Build a synthetic week-shaped chart from a single USD balance value. */
function buildChartData(balance: number, range: '7D' | '30D' | '90D' | '1Y') {
  if (balance <= 0) {
    const zero = { '7D': 7, '30D': 7, '90D': 3, '1Y': 4 }[range];
    return Array.from({ length: zero }, (_, i) => ({ date: `—`, value: 0 }));
  }
  const seed = balance;
  const steps = { '7D': 7, '30D': 7, '90D': 3, '1Y': 4 }[range];
  const labels7D   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const labels30D  = ['6w ago','5w ago','4w ago','3w ago','2w ago','1w ago','Now'];
  const labels90D  = ['90d ago','45d ago','Now'];
  const labels1Y   = ['Q3 2025','Q4 2025','Q1 2026','Q2 2026'];
  const labelsMap  = { '7D': labels7D, '30D': labels30D, '90D': labels90D, '1Y': labels1Y };
  const labels     = labelsMap[range];

  const result = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    const noise = (Math.sin(i * 2.4 + 1) * 0.06 + Math.sin(i * 5.1) * 0.03);
    const val = seed * (0.55 + 0.45 * progress + noise);
    result.push({ date: labels[i], value: Math.max(0, Math.round(val)) });
  }
  return result;
}

/** Map a real transaction to an activity row. */
function txToActivity(tx: Transaction) {
  const isSent = tx.type === 'sent';
  const sign   = isSent ? '-' : '+';
  const label  = isSent
    ? `Sent to ${tx.toName ?? tx.to?.slice(0, 8) ?? 'Unknown'} · ${tx.chain}`
    : `Received from ${tx.fromName ?? tx.from?.slice(0, 8) ?? 'Unknown'} · ${tx.chain}`;
  return {
    id:     tx.id,
    title:  label,
    date:   tx.date,
    amount: `${sign}$${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    status: tx.status === 'completed' ? 'Settled' : tx.status === 'pending' ? 'Consolidating' : 'Failed',
    symbol: tx.asset,
  };
}

/** Get current greeting phrase (morning/afternoon/evening). */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Format current date as "Overview · Jul 2026". */
function getEyebrow() {
  return `Overview · ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

export default function Overview() {
  const { isConnected, address, balance, transactions, activeChains, primaryAssets } = useParticle();

  const [activeNetwork, setActiveNetwork] = useState('all');
  const [copied, setCopied] = useState(false);
  const [usdMode, setUsdMode] = useState(true);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [activityFilter, setActivityFilter] = useState<'All' | 'Settled' | 'Consolidating'>('All');

  /* ── address display ── */
  const displayAddress = isConnected && address ? address : '—';
  const displayAddressTruncated =
    displayAddress.startsWith('0x') && displayAddress.length > 12
      ? `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`
      : displayAddress;

  const handleCopyAddress = () => {
    if (!isConnected || !address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  /* ── network filtering ── */
  const filteredAssets = useMemo(() => {
    if (activeNetwork === 'all') return primaryAssets;
    const targetChain = resolveChainConfig(activeNetwork).value;
    return primaryAssets.filter(
      asset => resolveChainConfig(asset.chainName).value === targetChain
    );
  }, [primaryAssets, activeNetwork]);

  const filteredBalance = useMemo(() => {
    return filteredAssets.reduce((acc, a) => acc + (parseFloat(a.amountInUSD) || 0), 0);
  }, [filteredAssets]);

  /* ── balance display ── */
  const balanceDisplay = usdMode
    ? `$${filteredBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${(filteredBalance / 3350).toFixed(4)} ETH`;

  /* ── chart ── */
  const chartData = useMemo(() => buildChartData(filteredBalance, timeRange), [filteredBalance, timeRange]);

  /* ── activity feed ── */
  const activityRows = useMemo(() => {
    const rows = transactions.map(txToActivity);
    if (activityFilter === 'All') return rows;
    return rows.filter(r => r.status === activityFilter);
  }, [transactions, activityFilter]);

  /* ── donut segments ── */
  const chainBreakdown = useMemo(() => {
    if (!filteredAssets.length) return [{ name: 'No data', pct: 100, color: 'var(--border)' }];
    const colors: Record<string, string> = {
      'Ethereum': '#6366f1', 'Ethereum Mainnet': '#6366f1',
      'Base': '#2dd4bf',
      'Arbitrum One': '#38bdf8', 'Arbitrum': '#38bdf8',
      'BNB Chain': '#fbbf24',
      'X Layer': '#c084fc',
    };
    const byChain = new Map<string, number>();
    for (const asset of filteredAssets) {
      const usd = parseFloat(asset.amountInUSD) || 0;
      byChain.set(asset.chainName, (byChain.get(asset.chainName) ?? 0) + usd);
    }
    const total = [...byChain.values()].reduce((s, v) => s + v, 0) || 1;
    return [...byChain.entries()].map(([name, usd]) => ({
      name,
      pct: Math.round((usd / total) * 100),
      color: colors[name] ?? '#94a3b8',
    }));
  }, [filteredAssets]);

  const circumference = 2 * Math.PI * 50; // r=50

  /* ── donut offsets ── */
  const donutSegments = useMemo(() => {
    let cumulative = 0;
    return chainBreakdown.map(seg => {
      const dash = (seg.pct / 100) * circumference;
      const offset = -cumulative;
      cumulative += dash;
      return { ...seg, dash, offset };
    });
  }, [chainBreakdown, circumference]);

  /* ── eyebrow / greeting ── */
  const eyebrow  = useMemo(getEyebrow,  []);
  const greeting = useMemo(getGreeting, []);
  const shortAddr = isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'you';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
            {greeting}, {shortAddr}. <span className="text-[var(--muted)] italic">Everything's routed.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot" />
            <span>Auto-routing active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-full text-xs font-medium">
            <Zap size={12} className="text-[var(--accent)]" />
            <span>Gasless inbound · on</span>
          </div>
        </div>
      </div>

      {/* ── 12-col Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. Universal Deposit Address Hero (col-span-8) */}
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px] shadow-soft">
          <div className="absolute inset-0 grid-paper pointer-events-none z-0" />
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[var(--accent)] opacity-[0.04] blur-3xl pointer-events-none z-0" />

          <div className="relative z-10 space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)]">
                  UNIVERSAL DEPOSIT ADDRESS
                </span>
                {isConnected ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--border)] text-[var(--muted-foreground)] text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Disconnected
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-dim)] text-[var(--accent)] px-2.5 py-0.5 rounded-full">
                One address · every network
              </span>
            </div>

            {/* Network chips */}
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)] font-medium">Receive on</label>
              <div className="flex flex-wrap gap-1.5">
                {networksList.map(net => (
                  <button
                    key={net.id}
                    onClick={() => setActiveNetwork(net.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                      activeNetwork === net.id
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-soft'
                        : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {net.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${net.color}`} />}
                    {net.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Address block */}
            <div className="flex items-center justify-between bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-4 group hover:border-[var(--border-hover)] transition-all">
              <div className="space-y-1.5 min-w-0">
                <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] leading-none select-all">
                  {isConnected ? displayAddressTruncated : <span className="text-[var(--muted-foreground)] text-base">Connect wallet to see address</span>}
                </div>
                {isConnected && (
                  <div className="font-mono text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate max-w-full select-all">
                    {displayAddress}
                  </div>
                )}
              </div>
              <button
                onClick={handleCopyAddress}
                disabled={!isConnected}
                className={`w-12 h-12 rounded-[var(--radius)] border flex items-center justify-center transition-all shrink-0 ml-3 disabled:opacity-30 disabled:cursor-not-allowed ${
                  copied
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-glow'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] hover:scale-[1.02]'
                }`}
                title="Copy address"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Micro-status row */}
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] bg-[var(--background)]/40 p-2.5 rounded-lg border border-[var(--border)]/50">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-dot shrink-0" />
              <span>Unified balance · Pay any chain from any asset · Zero gas required</span>
            </div>
          </div>

          {/* Mini-stat strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--border)] pt-4 mt-6 relative z-10">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Unified Balance</div>
              <div className="font-mono text-sm font-semibold text-[var(--foreground)]">
                ${filteredBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Total Transactions</div>
              <div className="text-xs text-[var(--foreground)] font-medium">
                {transactions.length} recorded
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Active Chains</div>
              <div className="text-xs text-[var(--foreground)] font-medium">
                {activeChains.length > 0 ? `${activeChains.length} chains` : 'None connected'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Total Balance Card (col-span-4) */}
        <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 flex flex-col justify-between shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--muted)]">
                TOTAL BALANCE
              </span>
              <button
                onClick={() => setUsdMode(m => !m)}
                className="px-2 py-0.5 bg-[var(--background)] border border-[var(--border)] text-[10px] font-semibold rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {usdMode ? 'USD' : 'NATIVE'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[var(--foreground)] truncate">
                {balanceDisplay}
              </div>
              {filteredBalance > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-0.5">
                    <TrendingUp size={12} />
                    Live
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">Particle UA balance</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Active Chains</div>
              <div className="font-serif text-xl font-bold">
                {activeChains.length > 0 ? activeChains.length : '—'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Transactions</div>
              <div className="font-mono text-sm font-bold text-[var(--accent)]">
                {transactions.length}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Balance Chart (full width) */}
        <div className="lg:col-span-12 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Portfolio Value</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {filteredBalance > 0 ? 'Projected historical curve based on current Particle UA balance' : 'Connect wallet to see portfolio history'}
              </p>
            </div>
            <div className="flex bg-[var(--background)] border border-[var(--border)] rounded-lg p-1 text-xs shrink-0 self-start sm:self-auto">
              {(['7D', '30D', '90D', '1Y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                    timeRange === range
                      ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-soft'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="oklch(0.62 0.14 165)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="oklch(0.62 0.14 165)" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-3 shadow-glow font-serif">
                          <p className="text-xs text-[var(--muted-foreground)] font-sans">{payload[0].payload.date}</p>
                          <p className="text-lg font-bold text-[var(--foreground)] mt-0.5">
                            ${(payload[0].value as number).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.62 0.14 165)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#emeraldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Activity Feed (col-span-8) */}
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {transactions.length > 0 ? `${transactions.length} transactions from your Universal Account` : 'No transactions yet'}
              </p>
            </div>
            <div className="flex bg-[var(--background)] border border-[var(--border)] rounded-lg p-0.5 text-xs">
              {(['All', 'Settled', 'Consolidating'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activityFilter === f
                      ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-soft'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {activityRows.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                {transactions.length === 0 ? 'Send or receive a transaction to see activity here.' : 'No transactions match this filter.'}
              </div>
            ) : (
              activityRows.slice(0, 6).map(act => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                      act.amount.startsWith('+')
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)]'
                    }`}>
                      {act.amount.startsWith('+') ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--foreground)] truncate">{act.title}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{act.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-sm font-semibold text-[var(--foreground)]">{act.amount}</span>
                    {act.status === 'Settled'       && <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full tracking-wide">Settled</span>}
                    {act.status === 'Consolidating' && <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full tracking-wide animate-pulse">Consolidating</span>}
                    {act.status === 'Failed'        && <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full tracking-wide">Failed</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Distribution Donut (col-span-4) */}
        <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Active Chains</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {activeChains.length > 0 ? 'Chains enabled on your Universal Account' : 'Connect wallet to see chain breakdown'}
            </p>
          </div>

          {activeChains.length > 0 ? (
            <>
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" className="stroke-[var(--border)] fill-transparent" strokeWidth="10" />
                  {donutSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="60" cy="60" r="50"
                      fill="transparent"
                      strokeWidth="10"
                      stroke={seg.color}
                      strokeDasharray={`${seg.dash} ${circumference}`}
                      strokeDashoffset={seg.offset}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Balance</span>
                  <span className="font-serif text-xl font-bold text-[var(--foreground)] mt-0.5">
                    ${filteredBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {chainBreakdown.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: seg.color }} />
                      <span className="font-medium truncate max-w-[100px]">{seg.name}</span>
                    </div>
                    <span className="font-mono text-[var(--muted-foreground)]">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted-foreground)] italic">
              No active chains detected
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
