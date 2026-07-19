'use client';

import React, { useState, useEffect } from 'react';
import { useParticle } from '@/components/ParticleProvider';
import { ArrowLeft, Send, CheckCircle2, XCircle, Search, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SUPPORTED_CHAINS, SUPPORTED_ASSETS } from '@/shared/chains';

export default function SendPage() {
  const { send, contacts, previewRoute, balance } = useParticle();
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
    <div className="max-w-md mx-auto space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Send Payment</h1>
      </div>

      {status === 'success' ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24 }} className="p-8 text-center space-y-4">
          <div className="flex justify-center text-green-400">
            <CheckCircle2 size={64} />
          </div>
          <h2 className="text-2xl font-black">Transaction Sent!</h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            You successfully sent {amountInput} {selectedAsset} to {matchedContact?.name || `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`}.
          </p>
          {txId && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14 }} className="p-4 text-xs font-mono break-all text-left space-y-2">
              <span className="font-bold text-[var(--accent)]">Transaction ID:</span>
              <p>{txId}</p>
            </div>
          )}
          <button
            onClick={() => {
              setRecipientInput('');
              setAmountInput('');
              setStatus('idle');
              router.push('/dashboard');
            }}
            style={{ background: 'var(--accent)', color: 'white' }}
            className="w-full py-3 rounded-full font-bold hover:opacity-90 transition-opacity mt-4"
          >
            Go to Dashboard
          </button>
        </div>
      ) : status === 'error' ? (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24 }} className="p-8 text-center space-y-4">
          <div className="flex justify-center text-red-400">
            <XCircle size={64} />
          </div>
          <h2 className="text-2xl font-black">Payment Failed</h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {errorMessage}
          </p>
          <button
            onClick={() => setStatus('idle')}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)' }}
            className="w-full py-3 rounded-full font-bold hover:border-[var(--accent)] transition-colors mt-4"
          >
            Try Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-5">
          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Recipient</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter address or @username"
                value={recipientInput}
                onChange={e => setRecipientInput(e.target.value)}
                disabled={status !== 'idle'}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16 }}
                className="w-full px-5 py-4 pl-12 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white placeholder-gray-500"
                required
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            </div>
            {matchedContact && (
              <p style={{ color: 'var(--accent)' }} className="text-xs font-semibold">
                ✦ Resolves to {matchedContact.name} ({matchedContact.address.slice(0, 6)}...{matchedContact.address.slice(-4)})
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Amount</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              disabled={status !== 'idle'}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16 }}
              className="w-full px-5 py-4 text-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-colors text-white placeholder-gray-500"
              required
            />
          </div>

          {/* Asset & Destination Chain Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Receive Asset</label>
              <select
                value={selectedAsset}
                onChange={e => setSelectedAsset(e.target.value)}
                disabled={status !== 'idle'}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16 }}
                className="w-full px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white"
              >
                {SUPPORTED_ASSETS.map(asset => (
                  <option key={asset} value={asset} className="bg-black">
                    {asset}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Destination Chain</label>
              <select
                value={selectedChain}
                onChange={e => setSelectedChain(e.target.value)}
                disabled={status !== 'idle'}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16 }}
                className="w-full px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-white"
              >
                {SUPPORTED_CHAINS.map(c => (
                  <option key={c.value} value={c.value} className="bg-black">
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
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20 }} className="p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Routing Preview</h3>

                    {isPossible ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Source Funding:</span>
                          <span className="font-semibold text-white">
                            {route.sourceAsset} ({route.sourceChain})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>Required:</span>
                          <span className="font-semibold text-white">
                            {parseFloat(route.tokenAmount).toFixed(4)} {route.destinationAsset}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-muted)' }}>USD Equivalent:</span>
                          <span className="font-bold text-[var(--accent)]">${route.usdAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-2 text-xs text-gray-500">
                          Pay {amountInput} {selectedAsset} on {selectedChain} dynamically from {route.sourceAsset} balance on {route.sourceChain} without manually swapping or bridging!
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-400">
                        Insufficient funds or no available path. Please adjust the amount or deposit assets.
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status !== 'idle' || (usdAmount > 0 && !isPossible)}
                  style={{
                    background: (status !== 'idle' || (usdAmount > 0 && !isPossible)) ? 'var(--bg-elevated)' : 'var(--accent)',
                    color: (status !== 'idle' || (usdAmount > 0 && !isPossible)) ? 'var(--text-muted)' : 'white',
                    cursor: (status !== 'idle' || (usdAmount > 0 && !isPossible)) ? 'not-allowed' : 'pointer',
                  }}
                  className="w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  {status === 'signing' ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Approving & Signing in Wallet...
                    </>
                  ) : status === 'submitting' ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Submitting Transaction...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send Payment
                    </>
                  )}
                </button>
              </>
            );
          })()}
        </form>
      )}
    </div>
  );
}
