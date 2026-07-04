'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useParticle, resolveRecipient, type Contact } from '@/components/ParticleProvider';
import { ArrowRight, CheckCircle2, Loader2, ExternalLink, ChevronDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Screen = 'form' | 'confirm' | 'sending' | 'success';

export default function SendPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text-muted)' }} className="p-8 text-center">Loading...</div>}>
      <SendPageInner />
    </Suspense>
  );
}

const ASSETS = ['USDC', 'USDT', 'ETH', 'MATIC', 'BNB', 'AVAX'];

// All Particle Network co-testnet supported destination chains
const CHAINS = [
  { label: 'Ethereum Sepolia', value: 'Ethereum Sepolia', explorer: 'https://sepolia.etherscan.io/tx' },
  { label: 'Arbitrum Sepolia', value: 'Arbitrum Sepolia', explorer: 'https://sepolia.arbiscan.io/tx' },
  { label: 'Base Sepolia',     value: 'Base Sepolia',     explorer: 'https://sepolia-explorer.base.org/tx' },
  { label: 'Linea Sepolia',    value: 'Linea Sepolia',    explorer: 'https://sepolia.lineascan.build/tx' },
  { label: 'Avalanche Fuji',   value: 'Avalanche Fuji',   explorer: 'https://testnet.snowtrace.io/tx' },
  { label: 'BNB Testnet',      value: 'BNB Chain',        explorer: 'https://testnet.bscscan.com/tx' },
  { label: 'Berachain bArtio', value: 'Berachain',        explorer: 'https://artio.beratrail.io/tx' },
  { label: 'Polygon Amoy',     value: 'Polygon Amoy',     explorer: 'https://amoy.polygonscan.com/tx' },
];

function SendPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { contacts, sendPayment, balance } = useParticle();

  const [screen, setScreen] = useState<Screen>('form');
  const [recipient, setRecipient] = useState(searchParams.get('to') ?? '');
  const [resolvedContact, setResolvedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDC');
  const [chain, setChain] = useState('Base Sepolia');
  const [note, setNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [sendStep, setSendStep] = useState(0);

  // Resolve @username as user types
  useEffect(() => {
    if (!recipient) { setResolvedContact(null); return; }
    const match = resolveRecipient(recipient, contacts);
    setResolvedContact(match);
    if (match) {
      setAsset(match.preferred.asset);
      // Map old chain names to new Particle co-testnet names
      const chainMap: Record<string, string> = {
        'Polygon': 'Polygon Amoy', 'Base': 'Base Sepolia',
        'Ethereum': 'Ethereum Sepolia', 'Arbitrum': 'Arbitrum Sepolia',
        'BNB Chain': 'BNB Chain',
      };
      setChain(chainMap[match.preferred.chain] ?? match.preferred.chain);
    }
  }, [recipient, contacts]);

  const handleReview = () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) return;
    setScreen('confirm');
  };

  const handleSign = async () => {
    setScreen('sending');
    setSendStep(1);
    
    const t2 = setTimeout(() => setSendStep(2), 2000);
    const t3 = setTimeout(() => setSendStep(3), 4500);

    try {
      const hash = await sendPayment(recipient, parseFloat(amount), asset, chain, note);
      setSendStep(4);
      setTxHash(hash);
      setTimeout(() => setScreen('success'), 800);
    } catch (err: any) {
      clearTimeout(t2);
      clearTimeout(t3);
      console.error('Transaction failed:', err);
      setScreen('confirm');
      setSendStep(0);
      alert(err.message || 'Transaction failed or was rejected in MetaMask.');
    }
  };

  const reset = () => {
    setRecipient('');
    setAmount('');
    setNote('');
    setScreen('form');
    setSendStep(0);
  };

  return (
    <div className="max-w-lg mx-auto fade-in-up">
      <h1 className="text-3xl font-black mb-8">Send Money</h1>

      {/* ── FORM ── */}
      {screen === 'form' && (
        <div className="card space-y-6">
          {/* Recipient */}
          <div>
            <label style={{ color: 'var(--text-muted)' }} className="block text-sm mb-2">To</label>
            <div className="relative">
              <input
                type="text"
                placeholder="@username or 0x address"
                className="input-dark pr-28"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
              {resolvedContact && (
                <div style={{ background: 'var(--accent)', color: '#000' }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ {resolvedContact.name}
                </div>
              )}
            </div>
            {resolvedContact && (
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1 ml-1">
                {resolvedContact.address.slice(0, 20)}...
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label style={{ color: 'var(--text-muted)' }} className="block text-sm mb-2">Amount</label>
            <div className="relative">
              <span style={{ color: 'var(--text-muted)', position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', fontWeight: 700 }}>$</span>
              <input
                type="number"
                placeholder="0"
                className="input-dark text-3xl font-black pl-10"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-1 ml-1">
              Available: ${balance.toLocaleString()} · Particle auto-selects source asset
            </p>
          </div>

          {/* Recipient receives */}
          <div>
            <label style={{ color: 'var(--text-muted)' }} className="block text-sm mb-2">
              Recipient receives <span style={{ color: 'var(--accent)' }}>(auto-routed by Particle)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  className="input-dark appearance-none pr-8"
                  value={asset}
                  onChange={e => setAsset(e.target.value)}
                >
                  {ASSETS.map(a => <option key={a}>{a}</option>)}
                </select>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <div className="relative">
                <select
                  className="input-dark appearance-none pr-8"
                  value={chain}
                  onChange={e => setChain(e.target.value)}
                >
                  {CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={{ color: 'var(--text-muted)' }} className="block text-sm mb-2">Note (optional)</label>
            <input
              type="text"
              placeholder="What's this for?"
              className="input-dark"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Particle badge */}
          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 14 }} className="p-4">
            <p style={{ color: 'var(--accent)' }} className="text-xs font-semibold mb-1">✦ How this works</p>
            <p style={{ color: 'var(--text-subtle)' }} className="text-xs leading-relaxed">
              You sign <strong className="text-white">one transaction</strong>. Particle Network handles the cross-chain routing,
              swap, and gas. No bridging. No network switching.
            </p>
          </div>

          <button
            onClick={handleReview}
            disabled={!recipient || !amount || parseFloat(amount) <= 0}
            className="btn-accent w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review Transfer <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* ── CONFIRM ── */}
      {screen === 'confirm' && (
        <div className="card space-y-6 fade-in-up">
          <h2 className="text-xl font-bold text-center">Confirm Transfer</h2>

          {/* Route visualization */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 16 }} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">You pay</p>
                <p className="text-2xl font-black">${parseFloat(amount || '0').toFixed(2)}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">ETH · Base (auto-selected)</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div style={{ color: 'var(--accent)' }} className="text-2xl">→</div>
                <span style={{ color: 'var(--accent)' }} className="text-xs font-semibold">Particle</span>
              </div>
              <div className="text-right">
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">{resolvedContact?.name ?? recipient} receives</p>
                <p className="text-2xl font-black">{parseFloat(amount || '0').toFixed(2)} {asset}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{asset} · {chain}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              { label: 'Recipient', value: resolvedContact ? `@${resolvedContact.username}` : recipient },
              { label: 'Destination', value: `${asset} on ${chain}` },
              { label: 'Gas fees', value: 'Sponsored by Particle ✦ Free' },
              { label: 'Estimated time', value: '~15 seconds' },
              { label: 'Note', value: note || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">{row.label}</span>
                <span className="text-sm font-medium" style={{ color: row.label === 'Gas fees' ? 'var(--accent)' : 'var(--text)' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setScreen('form')}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              className="flex-1 py-3 rounded-full font-semibold hover:border-[var(--accent)] transition-colors">
              Back
            </button>
            <button onClick={handleSign} className="btn-accent flex-2 px-8 py-3 flex items-center justify-center gap-2" style={{ flex: 2 }}>
              Sign & Send ⚡
            </button>
          </div>
        </div>
      )}

      {/* ── SENDING ── */}
      {screen === 'sending' && (
        <div className="card text-center py-8 fade-in-up">
          <h2 className="text-xl font-bold mb-8">Processing...</h2>
          <div className="space-y-6 text-left max-w-sm mx-auto">
            {[
              { label: 'Initiating EIP-7702 transaction', sub: 'Gas sponsored via Paymaster' },
              { label: 'Particle Network routing', sub: `Swapping ETH → ${asset}` },
              { label: 'Executing cross-chain transfer', sub: `Bridging to ${chain}` },
              { label: 'Confirmed on-chain', sub: `${resolvedContact?.name ?? recipient} received ${amount} ${asset}` },
            ].map((step, i) => {
              const done = sendStep > i + 1;
              const active = sendStep === i + 1;
              return (
                <div key={i} className="relative flex items-start gap-4">
                  {i < 3 && <div className={`step-line ${done ? 'done' : ''}`} />}
                  <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: done ? 'var(--accent)' : active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: `2px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    {done ? <span style={{ color: '#000', fontSize: 12 }}>✓</span> :
                      active ? <Loader2 size={12} style={{ color: 'var(--accent)' }} className="animate-spin" /> :
                        null}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${done ? 'text-white' : active ? 'text-white' : ''}`}
                      style={{ color: done || active ? undefined : 'var(--text-muted)' }}>
                      {step.label}
                    </p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {screen === 'success' && (
        <div className="card text-center py-10 fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid var(--success)' }}>
            ✓
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--success)' }}>Payment Sent!</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-8">
            {resolvedContact?.name ?? recipient} received ${amount} {asset} on {chain}
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              { label: 'Amount', value: `$${parseFloat(amount).toFixed(2)}` },
              { label: 'Recipient', value: resolvedContact ? `@${resolvedContact.username}` : recipient },
              { label: 'Asset', value: `${asset} on ${chain}` },
              { label: 'Tx ID', value: txHash },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">{row.label}</span>
                <span className="text-sm font-medium font-mono truncate max-w-[200px]">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <a href={`${CHAINS.find(c => c.value === chain)?.explorer ?? 'https://sepolia.etherscan.io/tx'}/${txHash}`}
              target="_blank" rel="noopener noreferrer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              className="flex-1 py-3 rounded-full font-semibold flex items-center justify-center gap-2 text-sm hover:border-[var(--accent)] transition-colors">
              <ExternalLink size={14} /> View on Explorer
            </a>
            <button onClick={reset} className="btn-accent flex-1 py-3 text-sm">
              Send Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
