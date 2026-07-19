'use client';

import React, { useState, useEffect } from 'react';
import { useParticle } from '@/components/ParticleProvider';
import { ArrowLeft, Send as SendIcon, CheckCircle2, XCircle, Search, Loader2 } from 'lucide-react';
import { Link } from './router-mock';
import { useRouter } from 'next/navigation';
import { SUPPORTED_CHAINS, SUPPORTED_ASSETS, FALLBACK_USD_PRICES, type SupportedAsset } from '@shared/chains';

export const head = () => ({
  title: 'Fluid — Send Payment',
  meta: [
    { name: 'description', content: 'Send crypto to any chain using your unified balance.' },
    { property: 'og:title', content: 'Fluid — Send Payment' },
    { property: 'og:description', content: 'Send to any chain from any asset you hold — no swapping or bridging required.' },
  ],
});

export default function Send() {
  const { send, contacts, previewRoute, balance, isConnected } = useParticle();
  const router = useRouter();

  const [recipientInput, setRecipientInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>('Base');
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');

  const [status, setStatus] = useState<'idle' | 'loading' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
  const [txId, setTxId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recipient resolution
  const matchedContact = contacts.find(
    c =>
      c.username.toLowerCase() === recipientInput.replace('@', '').toLowerCase() ||
      c.name.toLowerCase() === recipientInput.toLowerCase()
  );
  const recipientAddress = matchedContact ? matchedContact.address : recipientInput;

  // Auto-fill preferred chain/asset if contact selected
  useEffect(() => {
    if (matchedContact?.preferred) {
      setSelectedAsset(matchedContact.preferred.asset);
      setSelectedChain(matchedContact.preferred.chain);
    }
  }, [recipientInput, matchedContact]);

  // Route preview calculation
  const usdAmount = parseFloat(amountInput) || 0;
  const route = previewRoute(usdAmount, selectedAsset, selectedChain);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress || !amountInput) return;

    setStatus('loading');
    setErrorMessage(null);

    try {
      setStatus('signing');
      const result = await send(recipientAddress, amountInput, selectedAsset, selectedChain);
      setTxId(result.transactionId);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Transaction failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-mono font-semibold">Transaction System</span>
        <h1 className="text-3xl sm:text-4xl font-serif text-[var(--foreground)] mt-1 tracking-tight">
          Send Payment. <span className="text-[var(--muted)] italic">Unified cross-chain routing.</span>
        </h1>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-soft">
        {!isConnected ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">Please connect your wallet to send transactions.</p>
          </div>
        ) : status === 'success' ? (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-[var(--accent)]">
              <CheckCircle2 size={64} className="animate-pulse-dot" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[var(--foreground)]">Transaction Sent!</h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto">
              Successfully sent {amountInput} {selectedAsset} to{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {matchedContact?.name || `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`}
              </span>.
            </p>
            {txId && (
              <div className="p-4 text-xs font-mono break-all text-left space-y-1.5 bg-[var(--background)] border border-[var(--border)] rounded-md">
                <span className="font-bold text-[var(--accent)]">Transaction Hash / ID:</span>
                <p className="text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-black">{txId}</p>
              </div>
            )}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => {
                  setRecipientInput('');
                  setAmountInput('');
                  setStatus('idle');
                }}
                className="flex-1 py-2 px-4 bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] rounded-[var(--radius)] text-xs font-semibold shadow-soft transition-all active:scale-[0.98]"
              >
                Send Another
              </button>
              <button
                onClick={() => {
                  router.push('/overview');
                }}
                className="flex-1 py-2 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-xs font-semibold hover:opacity-90 transition-all shadow-soft active:scale-[0.98]"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : status === 'error' ? (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-rose-500">
              <XCircle size={64} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[var(--foreground)]">Payment Failed</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {errorMessage}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-all shadow-soft active:scale-[0.98] mt-4"
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-5">
            {/* Recipient */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--muted-foreground)] font-semibold">Recipient Address or Username</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter address or @username"
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  disabled={status !== 'idle'}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors placeholder-[var(--muted)] text-[var(--foreground)]"
                  required
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={16} />
              </div>
              {matchedContact && (
                <p className="text-xs font-semibold text-[var(--accent)]">
                  ✦ Resolves to {matchedContact.name} ({matchedContact.address.slice(0, 6)}...{matchedContact.address.slice(-4)})
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--muted-foreground)] font-semibold">Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full px-3.5 py-3 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-2xl font-bold font-serif transition-colors placeholder-[var(--muted)] text-[var(--foreground)]"
                required
              />
            </div>

            {/* Asset & Destination Chain Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Receive Asset</label>
                <select
                  value={selectedAsset}
                  onChange={e => setSelectedAsset(e.target.value)}
                  disabled={status !== 'idle'}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors text-[var(--foreground)] cursor-pointer"
                >
                  {SUPPORTED_ASSETS.map(asset => (
                    <option key={asset} value={asset} className="bg-[var(--card)] text-[var(--foreground)]">
                      {asset}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[var(--muted-foreground)] font-semibold">Destination Chain</label>
                <select
                  value={selectedChain}
                  onChange={e => setSelectedChain(e.target.value)}
                  disabled={status !== 'idle'}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:border-[var(--primary)] text-sm transition-colors text-[var(--foreground)] cursor-pointer"
                >
                  {SUPPORTED_CHAINS.map(c => (
                    <option key={c.value} value={c.value} className="bg-[var(--card)] text-[var(--foreground)]">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Route Preview */}
            {(() => {
              const isPossible = usdAmount <= balance && route.sourceAsset !== 'Primary asset';
              return (
                <>
                  {usdAmount > 0 && (
                    <div className="bg-[var(--background)] border border-[var(--border)] rounded-[var(--radius)] p-4 space-y-3 text-xs">
                      <h3 className="font-bold text-[var(--foreground)] uppercase tracking-wider text-[10px]">Routing Preview</h3>

                      {isPossible ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">Source Funding:</span>
                            <span className="font-semibold text-[var(--foreground)]">
                              {route.sourceAsset} ({route.sourceChain})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">Required:</span>
                            <span className="font-semibold text-[var(--foreground)]">
                              {parseFloat(route.tokenAmount).toFixed(4)} {route.destinationAsset}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--muted-foreground)]">USD Equivalent:</span>
                            <span className="font-bold text-[var(--accent)]">${route.usdAmount.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
                            Pay {amountInput} {selectedAsset} on {selectedChain} dynamically from {route.sourceAsset} balance on {route.sourceChain} without manually swapping or bridging!
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-500 font-semibold">
                          Insufficient funds or no available path. Please adjust the amount or deposit assets.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status !== 'idle' || (usdAmount > 0 && !isPossible)}
                    className={`w-full py-3 px-4 rounded-[var(--radius)] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-soft active:scale-[0.98] ${
                      (status !== 'idle' || (usdAmount > 0 && !isPossible))
                        ? 'bg-[var(--border)] text-[var(--muted-foreground)] cursor-not-allowed'
                        : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 cursor-pointer'
                    }`}
                  >
                    {status === 'signing' ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Approving & Signing in Wallet...
                      </>
                    ) : status === 'submitting' ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Submitting Transaction...
                      </>
                    ) : (
                      <>
                        <SendIcon size={14} /> Send Payment
                      </>
                    )}
                  </button>
                </>
              );
            })()}
          </form>
        )}
      </div>
    </div>
  );
}
