'use client';

import { useParticle } from '@/components/ParticleProvider';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function ActivityPage() {
  const { transactions } = useParticle();

  return (
    <div className="fade-in-up">
      <h1 className="text-3xl font-black mb-8">Activity</h1>
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
          </div>
        ) : (
          transactions.map(tx => (
            <div key={tx.id} className="card flex items-center gap-4" style={{ padding: '16px 20px' }}>
              <div style={{
                background: tx.type === 'received' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                color: tx.type === 'received' ? 'var(--success)' : 'var(--danger)',
                borderRadius: '50%',
              }} className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                {tx.type === 'received' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{tx.type === 'sent' ? `Sent to ${tx.toName}` : `Received from ${tx.fromName}`}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">{tx.date}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{tx.asset} on {tx.chain}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-bold ${tx.type === 'received' ? 'text-green-400' : ''}`}>
                  {tx.type === 'sent' ? '-' : '+'}${tx.amount}
                </p>
                <span style={{
                  background: tx.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: tx.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                  borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 600
                }}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
