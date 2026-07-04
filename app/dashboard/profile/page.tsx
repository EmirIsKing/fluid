'use client';

import { useParticle } from '@/components/ParticleProvider';

export default function ProfilePage() {
  const { address, activeChains, balance, disconnect } = useParticle();

  return (
    <div className="max-w-lg mx-auto fade-in-up space-y-6">
      <h1 className="text-3xl font-black">Profile</h1>

      {/* Avatar + name */}
      <div className="card text-center py-10">
        <div style={{ background: 'linear-gradient(135deg, var(--accent), #7c3aed)', borderRadius: '50%' }}
          className="w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-black">
          U
        </div>
        <p className="text-2xl font-black mb-1">@user</p>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm font-mono">{address?.slice(0, 20)}...{address?.slice(-6)}</p>
      </div>

      {/* Universal Account Status */}
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Universal Account</h3>
          <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 99, padding: '2px 12px', fontSize: 12, fontWeight: 700 }}>
            EIP-7702 Active
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-4">
          Your wallet is upgraded. You can send cross-chain payments without switching networks or managing gas.
        </p>
        <div className="flex flex-wrap gap-2">
          {activeChains.map(c => (
            <span key={c} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 12px', fontSize: 12 }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Balance */}
      <div className="card">
        <h3 style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">Total Balance</h3>
        <p className="text-4xl font-black">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Across all chains</p>
      </div>

      {/* Preferred settings */}
      <div className="card space-y-4">
        <h3 className="font-bold">Payment Preferences</h3>
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-muted)' }} className="text-sm">Preferred receive asset</span>
          <span className="text-sm font-semibold">USDC</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-muted)' }} className="text-sm">Preferred receive chain</span>
          <span className="text-sm font-semibold">Polygon</span>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={disconnect}
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: 14 }}
        className="w-full py-4 font-semibold hover:bg-red-900/20 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
