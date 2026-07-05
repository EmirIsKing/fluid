'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useParticle, resolveRecipient, type Contact } from '@/components/ParticleProvider';
import { ArrowRight, Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import {
  SUPPORTED_CHAINS,
  SUPPORTED_ASSETS,
  UNIVERSALX_ACTIVITY_URL,
  assetsForChain,
  isValidRecipient,
  resolveChainConfig,
} from '@shared/chains';

export const dynamic = 'force-dynamic';

type Screen = 'form' | 'confirm' | 'sending' | 'success';

export default function SendPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text-muted)' }} className="p-8 text-center">Loading...</div>}>
      <SendPageInner />
    </Suspense>
  );
}

function SendPageInner() {
  const searchParams = useSearchParams();
  const { contacts, sendPayment, balance, previewRoute, mode } = useParticle();

  const [screen, setScreen] = useState<Screen>('form');
  const [recipient, setRecipient] = useState(searchParams.get('to') ?? '');
  const [resolvedContact, setResolvedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDC');
  const [chain, setChain] = useState('Base');
  const [note, setNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [sendStep, setSendStep] = useState(0);
  const [showRouting, setShowRouting] = useState(false);

  const usdAmount = parseFloat(amount) || 0;
  const chainAssets = useMemo(() => assetsForChain(chain), [chain]);
  const route = useMemo(
    () => (usdAmount > 0 ? previewRoute(usdAmount, asset, chain) : null),
    [usdAmount, asset, chain, previewRoute],
  );

  useEffect(() => {
    if (!recipient) { setResolvedContact(null); return; }
    const match = resolveRecipient(recipient, contacts);
    setResolvedContact(match);
    if (match) {
      const chainConfig = resolveChainConfig(match.preferred.chain);
      setChain(chainConfig.value);
      const preferredAssets = assetsForChain(chainConfig.value);
      setAsset(
        preferredAssets.includes(match.preferred.asset as typeof preferredAssets[number])
          ? match.preferred.asset
          : preferredAssets[0] ?? 'USDC',
      );
    }
  }, [recipient, contacts]);

  useEffect(() => {
    const available = assetsForChain(chain);
    if (!available.includes(asset as typeof available[number])) {
      setAsset(available[0] ?? 'USDC');
    }
  }, [chain, asset]);

  const canReview =
    isValidRecipient(recipient) &&
    usdAmount > 0 &&
    usdAmount <= balance &&
    chainAssets.includes(asset as typeof chainAssets[number]);

  const handleReview = () => {
    if (!canReview) return;
    setScreen('confirm');
  };

  const handleSign = async () => {
    if (!route) return;
    setScreen('sending');
    setSendStep(1);

    const t2 = setTimeout(() => setSendStep(2), 2000);
    const t3 = setTimeout(() => setSendStep(3), 4500);

    try {
      const hash = await sendPayment(recipient, usdAmount, asset, chain, note);
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

  const explorerUrl = mode === 'demo' || txHash.startsWith('demo-')
    ? `${SUPPORTED_CHAINS.find(c => c.value === chain)?.explorer ?? 'https://basescan.org/tx'}/${txHash}`
    : `${UNIVERSALX_ACTIVITY_URL}${txHash}`;

  return (
    <div className="max-w-lg mx-auto fade-in-up">
      <h1 className="text-3xl font-black mb-8">Send Money</h1>

      {screen === 'form' && (
        <div className="card space-y-6">
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

          <div>
            <label style={{ color: 'var(--text-muted)' }} className="block text-sm mb-2">Amount (USD)</label>
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
            {route && (
              <p style={{ color: 'var(--text-subtle)' }} className="text-xs mt-1 ml-1">
                Delivers ~{route.tokenAmount} {asset} on {chain}
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowRouting(!showRouting)}
              style={{ color: 'var(--text-muted)' }}
              className="text-xs hover:text-white flex items-center gap-1 transition-colors mt-2"
            >
              <span>{showRouting ? 'Hide' : 'Show'} destination settings</span>
              <ChevronDown size={12} className={`transform transition-transform ${showRouting ? 'rotate-180' : ''}`} />
            </button>

            {showRouting && (
              <div className="mt-3 p-4 rounded-xl space-y-4 border border-[var(--border)] fade-in-up" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)' }} className="block text-xs mb-1.5">
                    Recipient receives <span style={{ color: 'var(--accent)' }}>(you pay from unified balance)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <select
                        className="input-dark appearance-none pr-8 text-sm py-2"
                        value={asset}
                        onChange={e => setAsset(e.target.value)}
                      >
                        {chainAssets.map(a => <option key={a}>{a}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                    <div className="relative">
                      <select
                        className="input-dark appearance-none pr-8 text-sm py-2"
                        value={chain}
                        onChange={e => setChain(e.target.value)}
                      >
                        {SUPPORTED_CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 14 }} className="p-4">
            <p style={{ color: 'var(--accent)' }} className="text-xs font-semibold mb-1">✦ How this works</p>
            <p style={{ color: 'var(--text-subtle)' }} className="text-xs leading-relaxed">
              You sign <strong className="text-white">one transaction</strong>. Particle picks the best Primary Asset
              from your balance and settles on {chain}. You never open a swap or bridge UI.
            </p>
          </div>

          <button
            onClick={handleReview}
            disabled={!canReview}
            className="btn-accent w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review Transfer <ArrowRight size={20} />
          </button>
        </div>
      )}

      {screen === 'confirm' && route && (
        <div className="card space-y-6 fade-in-up">
          <h2 className="text-xl font-bold text-center">Confirm Transfer</h2>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 16 }} className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">You pay</p>
                <p className="text-2xl font-black">${usdAmount.toFixed(2)}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                  {route.sourceAsset} · {route.sourceChain} (auto-selected)
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div style={{ color: 'var(--accent)' }} className="text-2xl">→</div>
                <span style={{ color: 'var(--accent)' }} className="text-xs font-semibold">Particle</span>
              </div>
              <div className="text-right">
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-1">{resolvedContact?.name ?? recipient} receives</p>
                <p className="text-2xl font-black">{route.tokenAmount} {asset}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">{asset} · {chain}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Recipient', value: resolvedContact ? `@${resolvedContact.username}` : recipient },
              { label: 'Destination', value: `${route.tokenAmount} ${asset} on ${chain}` },
              { label: 'Source (estimated)', value: `${route.sourceAsset} on ${route.sourceChain}` },
              { label: 'Gas fees', value: 'Sponsored by Particle ✦ Free' },
              { label: 'Estimated time', value: '~15 seconds' },
              { label: 'Note', value: note || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">{row.label}</span>
                <span className="text-sm font-medium text-right max-w-[55%]" style={{ color: row.label === 'Gas fees' ? 'var(--accent)' : 'var(--text)' }}>
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

      {screen === 'sending' && route && (
        <div className="card text-center py-8 fade-in-up">
          <h2 className="text-xl font-bold mb-8">Processing...</h2>
          <div className="space-y-6 text-left max-w-sm mx-auto">
            {[
              { label: 'Signing Universal Account transaction', sub: 'One signature — gas sponsored' },
              { label: 'Particle routing liquidity', sub: `Using ${route.sourceAsset} on ${route.sourceChain}` },
              { label: 'Settling cross-chain', sub: `Delivering ${route.tokenAmount} ${asset} on ${chain}` },
              { label: 'Confirmed', sub: `${resolvedContact?.name ?? recipient} received ${route.tokenAmount} ${asset}` },
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

      {screen === 'success' && route && (
        <div className="card text-center py-10 fade-in-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid var(--success)' }}>
            ✓
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ color: 'var(--success)' }}>Payment Sent!</h2>
          <p style={{ color: 'var(--text-muted)' }} className="mb-8">
            {resolvedContact?.name ?? recipient} received {route.tokenAmount} {asset} on {chain}
          </p>

          <div className="space-y-3 text-left mb-8">
            {[
              { label: 'USD value', value: `$${usdAmount.toFixed(2)}` },
              { label: 'Paid from', value: `${route.sourceAsset} on ${route.sourceChain}` },
              { label: 'Recipient', value: resolvedContact ? `@${resolvedContact.username}` : recipient },
              { label: 'Delivered', value: `${route.tokenAmount} ${asset} on ${chain}` },
              { label: 'Tx ID', value: txHash },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }} className="text-sm">{row.label}</span>
                <span className="text-sm font-medium font-mono truncate max-w-[200px]">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <a href={explorerUrl}
              target="_blank" rel="noopener noreferrer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
              className="flex-1 py-3 rounded-full font-semibold flex items-center justify-center gap-2 text-sm hover:border-[var(--accent)] transition-colors">
              <ExternalLink size={14} /> View Activity
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
