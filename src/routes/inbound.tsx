'use client';

import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, ArrowDownLeft, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useParticle, type Transaction } from '@/components/ParticleProvider';
import { SUPPORTED_CHAINS, UNIVERSALX_ACTIVITY_URL } from '@shared/chains';

export const head = () => ({
  title: 'Fluid — Inbound Deposits',
  meta: [
    { name: 'description', content: 'Track inbound transactions, payments, and smart sweeps.' },
    { property: 'og:title', content: 'Fluid — Inbound Logs' },
    { property: 'og:description', content: 'Check deposit and auto-route status on all chains.' },
  ],
});

type StatusFilter = 'All' | 'Settled' | 'Consolidating' | 'Failed';
type DateRange    = 'All' | '24H' | '7D' | '30D';

function txStatus(tx: Transaction): StatusFilter {
  if (tx.status === 'completed') return 'Settled';
  if (tx.status === 'pending')   return 'Consolidating';
  return 'Failed';
}

/** How many "days ago" we estimate this tx is (approximation from date string). */
function estimateDaysAgo(date: string): number {
  const d = date.toLowerCase();
  if (d.includes('just now') || d.includes('min'))   return 0;
  if (d.includes('hour'))                            return 0;
  if (d.includes('yesterday') || d === '1 day ago') return 1;
  const m = d.match(/(\d+)\s*day/);
  if (m) return parseInt(m[1]);
  return 999;
}

function explorerUrl(chain: string, hash: string) {
  if (hash.startsWith('demo-')) {
    const configured = SUPPORTED_CHAINS.find(c => c.label === chain || c.value === chain);
    return `${configured?.explorer ?? 'https://basescan.org/tx'}/${hash}`;
  }
  return `${UNIVERSALX_ACTIVITY_URL}${hash}`;
}

export default function Inbound() {
  const { isConnected, transactions } = useParticle();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [dateRange, setDateRange]       = useState<DateRange>('All');
  const [search, setSearch]             = useState('');

  const inboundTxs = useMemo(
    () => transactions.filter(tx => tx.type === 'received'),
    [transactions],
  );

  const filtered = useMemo(() => {
    return inboundTxs.filter(tx => {
      const matchStatus = statusFilter === 'All' || txStatus(tx) === statusFilter;
      const daysAgo = estimateDaysAgo(tx.date);
      const matchDate =
        dateRange === 'All'  ? true :
        dateRange === '24H'  ? daysAgo === 0 :
        dateRange === '7D'   ? daysAgo <= 7  :
        daysAgo <= 30;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (tx.fromName ?? '').toLowerCase().includes(q) ||
        (tx.from      ?? '').toLowerCase().includes(q) ||
        tx.asset.toLowerCase().includes(q)             ||
        tx.chain.toLowerCase().includes(q)             ||
        (tx.txHash ?? '').toLowerCase().includes(q);
      return matchStatus && matchDate && matchSearch;
    });
  }, [inboundTxs, statusFilter, dateRange, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Inbound Transactions</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
          Receive Logs. <span className="text-[var(--muted)] italic">Realtime multichain streams.</span>
        </h1>
      </div>

      {/* Controls */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-soft p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status tabs */}
          <div className="flex bg-[var(--background)] border border-[var(--border)] rounded-lg p-0.5 text-xs self-start overflow-x-auto max-w-full">
            {(['All', 'Settled', 'Consolidating', 'Failed'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all whitespace-nowrap ${
                  statusFilter === s ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-soft' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={14} />
              <input type="text" placeholder="Search sender, hash, network…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] transition-colors placeholder-[var(--muted)]" />
            </div>
            <div className="relative w-full sm:w-40 flex items-center bg-[var(--background)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs text-[var(--foreground)]">
              <Calendar size={14} className="text-[var(--muted-foreground)] mr-1.5 shrink-0" />
              <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
                className="bg-transparent border-none outline-none focus:ring-0 w-full font-semibold cursor-pointer appearance-none">
                <option value="All">All Time</option>
                <option value="24H">Last 24 Hours</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-soft overflow-hidden">
        {!isConnected ? (
          <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">Connect your wallet to view inbound transactions.</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
            {inboundTxs.length === 0 ? 'No inbound transactions yet.' : 'No transactions match the current filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Network</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Value (USD)</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4 text-center">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {filtered.map(tx => {
                  const status = txStatus(tx);
                  const sender  = tx.fromName ?? tx.from ?? 'Unknown';
                  const shortAddr = tx.from ? `${tx.from.slice(0, 8)}…${tx.from.slice(-4)}` : '—';
                  const hashDisplay = tx.txHash ? `${tx.txHash.slice(0, 10)}…` : '—';
                  return (
                    <tr key={tx.id} className="hover:bg-[var(--border)]/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                            <ArrowDownLeft size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--foreground)]">{sender}</div>
                            <div className="font-mono text-[10px] text-[var(--muted-foreground)]">{shortAddr}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded-md">{tx.chain}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs text-[var(--foreground)]">
                        {tx.amount} {tx.asset}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-xs font-semibold text-[var(--foreground)]">
                        ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {status === 'Settled'       && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase"><CheckCircle2 size={10} />Settled</span>}
                        {status === 'Consolidating' && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-full uppercase animate-pulse"><Clock size={10} />Consolidating</span>}
                        {status === 'Failed'        && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full uppercase"><XCircle size={10} />Failed</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--muted-foreground)] font-mono">{tx.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                        {tx.txHash ? (
                          <a href={explorerUrl(tx.chain, tx.txHash)} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-mono font-medium hover:underline bg-[var(--background)] px-2 py-1 border border-[var(--border)] rounded">
                            {hashDisplay}
                            <ExternalLink size={10} />
                          </a>
                        ) : <span className="text-[var(--muted-foreground)]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
