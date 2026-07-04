'use client';

import Link from 'next/link';
import { useParticle } from '@/components/ParticleProvider';
import { ArrowUpRight, ArrowDownLeft, Plus, Send } from 'lucide-react';

export default function DashboardPage() {
  const { balance, transactions, contacts, isConnected } = useParticle();

  return (
    <div className="space-y-6 fade-in-up">
      {/* Balance Card */}
      <div style={{ background: 'linear-gradient(135deg, #00D4AA22, #7c3aed22)', border: '1px solid var(--border)', borderRadius: 24 }}
        className="p-8 text-center">
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">Total Portfolio Balance</p>
        <p className="text-6xl font-black tracking-tight mb-1">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }} className="text-xs px-2 py-0.5 rounded-full font-semibold">
            ✦ Universal Account Active
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link href="/dashboard/send" className="btn-accent flex items-center gap-2 px-7 py-3">
            <Send size={16} /> Send
          </Link>
          <Link href="/dashboard/receive"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
            className="flex items-center gap-2 px-7 py-3 rounded-full font-bold hover:border-[var(--accent)] transition-colors">
            <ArrowDownLeft size={16} /> Receive
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Chains', value: '4' },
          { label: 'Contacts', value: contacts.length.toString() },
          { label: 'Payments', value: transactions.length.toString() },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent contacts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recents</h2>
          <Link href="/dashboard/contacts" style={{ color: 'var(--accent)' }} className="text-sm">See all</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {contacts.map(c => (
            <Link key={c.id} href={`/dashboard/send?to=@${c.username}`}
              className="flex flex-col items-center gap-2 min-w-[64px]">
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold hover:border-[var(--accent)] transition-colors">
                {c.avatar}
              </div>
              <span style={{ color: 'var(--text-muted)' }} className="text-xs">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Recent Activity</h2>
          <Link href="/dashboard/activity" style={{ color: 'var(--accent)' }} className="text-sm">See all</Link>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 4).map(tx => (
            <div key={tx.id} className="card flex items-center gap-4" style={{ padding: '16px 20px' }}>
              <div style={{
                background: tx.type === 'received' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                color: tx.type === 'received' ? 'var(--success)' : 'var(--danger)',
                borderRadius: '50%',
              }} className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                {tx.type === 'received' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{tx.type === 'sent' ? `Sent to ${tx.toName}` : `Received from ${tx.fromName}`}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{tx.date} · {tx.asset} on {tx.chain}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'received' ? 'text-green-400' : ''}`}>
                  {tx.type === 'sent' ? '-' : '+'}${tx.amount}
                </p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
