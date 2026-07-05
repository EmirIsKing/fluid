'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Send as SendIcon, User, Coins, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useParticle, resolveRecipient } from '@/components/ParticleProvider';
import {
  SUPPORTED_CHAINS,
  assetsForChain,
  isValidRecipient,
  resolveChainConfig,
} from '@shared/chains';

export const head = () => ({
  title: 'Fluid — Send Crypto',
  meta: [
    { name: 'description', content: 'Send crypto to any recipient on supported networks from your unified balance.' },
    { property: 'og:title', content: 'Fluid — Send Crypto' },
    { property: 'og:description', content: 'Gasless cross-chain token transfers without swapping or bridging yourself.' },
  ],
});

export default function Send() {
  const { isConnected, balance, address, contacts, sendPayment, connect, previewRoute } = useParticle();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('Base');
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const chainAssets = useMemo(() => assetsForChain(selectedNetwork), [selectedNetwork]);
  const resolvedContact = resolveRecipient(recipient, contacts);
  const recipientLabel = resolvedContact
    ? `${resolvedContact.name} (${resolvedContact.address.slice(0, 10)}…)`
    : recipient.length > 10 ? `${recipient.slice(0, 10)}…` : recipient;

  const usdAmount = parseFloat(amount) || 0;
  const route = useMemo(
    () => (usdAmount > 0 ? previewRoute(usdAmount, selectedAsset, selectedNetwork) : null),
    [usdAmount, selectedAsset, selectedNetwork, previewRoute],
  );

  useEffect(() => {
    if (!chainAssets.includes(selectedAsset as typeof chainAssets[number])) {
      setSelectedAsset(chainAssets[0] ?? 'USDC');
    }
  }, [chainAssets, selectedAsset]);

  useEffect(() => {
    if (resolvedContact) {
      const chainConfig = resolveChainConfig(resolvedContact.preferred.chain);
      setSelectedNetwork(chainConfig.value);
      const preferred = assetsForChain(chainConfig.value);
      if (preferred.includes(resolvedContact.preferred.asset as typeof preferred[number])) {
        setSelectedAsset(resolvedContact.preferred.asset);
      }
    }
  }, [resolvedContact]);

  const isValid =
    isValidRecipient(recipient) &&
    usdAmount > 0 &&
    usdAmount <= balance &&
    chainAssets.includes(selectedAsset as typeof chainAssets[number]);
  const overBalance = usdAmount > balance && balance > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setErrorMsg(
        overBalance
          ? 'Amount exceeds your unified balance.'
          : !isValidRecipient(recipient)
            ? 'Enter a valid 0x address or @username.'
            : 'Please enter a valid USD amount and destination.',
      );
      return;
    }
    setErrorMsg(null);
    setTxHash(null);
    setLoading(true);
    try {
      const hash = await sendPayment(recipient, usdAmount, selectedAsset, selectedNetwork, note);
      setTxHash(hash);
      setRecipient('');
      setAmount('');
      setNote('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction rejected or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Dispatch Assets</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
          Send Payment. <span className="text-[var(--muted)] italic">From any asset, to any supported chain.</span>
        </h1>
      </div>

      {!isConnected ? (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-8 text-center space-y-4 shadow-soft">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Wallet Connection Required</h2>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Connect your Universal Account wallet to construct, sign, and broadcast transactions.
            </p>
          </div>
          <button onClick={() => connect('metamask')}
            className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold hover:opacity-90 transition-all shadow-soft">
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSubmit} className="md:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft space-y-5">
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Quick Select Contact</label>
                <div className="flex flex-wrap gap-2">
                  {contacts.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRecipient(`@${c.username}`)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs border rounded-full transition-all ${
                        recipient === `@${c.username}`
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center font-bold text-[10px]">{c.avatar}</span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center gap-1">
                <User size={12} />
                Recipient Address or @username
              </label>
              <input
                type="text"
                placeholder="e.g. @bob or 0x742d35Cc…"
                value={recipient}
                onChange={e => { setRecipient(e.target.value); setErrorMsg(null); }}
                disabled={loading}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors placeholder-[var(--muted)]"
              />
              {resolvedContact && (
                <p className="text-[10px] text-emerald-500 font-semibold pl-1">✓ Resolved: {resolvedContact.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center gap-1">
                  <Coins size={12} />
                  Deliver as
                </label>
                <select
                  value={selectedAsset}
                  onChange={e => setSelectedAsset(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors cursor-pointer"
                >
                  {chainAssets.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold flex items-center justify-between">
                  Amount (USD)
                  <span className="font-mono">
                    Balance: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setErrorMsg(null); }}
                    disabled={loading}
                    className={`w-full pl-7 pr-20 py-2 bg-[var(--background)] border rounded-md focus:outline-none text-sm transition-colors placeholder-[var(--muted)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      overBalance ? 'border-rose-500 focus:border-rose-500' : 'border-[var(--border)] focus:border-[var(--primary)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(balance.toFixed(2))}
                    disabled={loading || balance <= 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-[var(--card)] border border-[var(--border)] text-[10px] font-bold rounded hover:text-[var(--foreground)] transition-colors text-[var(--muted-foreground)] disabled:opacity-30"
                  >
                    MAX
                  </button>
                </div>
                {overBalance && (
                  <p className="text-[10px] text-rose-500 font-semibold pl-1">Amount exceeds balance.</p>
                )}
                {route && (
                  <p className="text-[10px] text-[var(--muted-foreground)] pl-1">
                    Delivers ~{route.tokenAmount} {selectedAsset} on {selectedNetwork}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--muted-foreground)] font-semibold">Destination Chain</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_CHAINS.map(net => (
                  <button
                    key={net.value}
                    type="button"
                    onClick={() => setSelectedNetwork(net.value)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-md border text-xs font-semibold transition-all flex items-center gap-2 ${
                      selectedNetwork === net.value
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-soft'
                        : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${net.dotColor}`} />
                    {net.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--muted-foreground)] font-semibold">Note (optional)</label>
              <input
                type="text"
                placeholder="Payment memo…"
                value={note}
                onChange={e => setNote(e.target.value)}
                disabled={loading}
                maxLength={120}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors placeholder-[var(--muted)]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            {txHash && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-600 dark:text-emerald-400 space-y-1.5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  <span className="font-semibold">Transaction dispatched successfully!</span>
                </div>
                <div className="font-mono break-all text-[10px] pl-5">ID: {txHash}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold tracking-wider hover:opacity-95 shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" />Settling cross-chain…</>
              ) : (
                <><SendIcon size={14} />Dispatch Payment</>
              )}
            </button>
          </form>

          <div className="md:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 shadow-soft space-y-4 text-xs sticky top-6">
            <h3 className="font-semibold text-sm border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-[var(--accent)]" />
              Route Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Recipient</span>
                <span className="font-semibold truncate max-w-[120px] text-right">{recipientLabel || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">You pay</span>
                <span className="font-mono font-semibold">{usdAmount > 0 ? `$${usdAmount.toFixed(2)}` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Source (est.)</span>
                <span className="font-semibold text-right max-w-[120px] truncate">
                  {route ? `${route.sourceAsset} · ${route.sourceChain}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Delivers</span>
                <span className="font-mono font-semibold">
                  {route ? `${route.tokenAmount} ${selectedAsset}` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Destination</span>
                <span className="font-semibold">{selectedNetwork}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Protocol Fee</span>
                <span className="font-semibold text-emerald-500">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted-foreground)]">Est. Settlement</span>
                <span className="font-semibold">~15 seconds</span>
              </div>
            </div>
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md space-y-1.5">
              <div className="font-semibold text-[10px] uppercase text-[var(--muted)]">Connected wallet</div>
              <p className="font-mono text-[10px] break-all text-[var(--muted-foreground)]">{address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
