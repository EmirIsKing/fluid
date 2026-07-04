'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useParticle } from '@/components/ParticleProvider';
import { Copy, Check, ChevronDown } from 'lucide-react';

export default function ReceivePage() {
  const { address } = useParticle();
  const [copied, setCopied] = useState(false);
  const [asset, setAsset] = useState('USDC');
  const [chain, setChain] = useState('Polygon');
  const [amount, setAmount] = useState('');

  const paymentLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://onepay.app'}/pay/${address?.slice(0, 10)}?asset=${asset}&chain=${chain}${amount ? `&amount=${amount}` : ''}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto fade-in-up">
      <h1 className="text-3xl font-black mb-8">Receive Money</h1>

      <div className="card text-center space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div style={{ background: 'white', borderRadius: 20, padding: 20 }}>
            <QRCodeSVG value={paymentLink} size={200} level="H" />
          </div>
        </div>

        {/* Address */}
        <div>
          <p style={{ color: 'var(--text-muted)' }} className="text-xs mb-2">Your Universal Account Address</p>
          <button
            onClick={() => copy(address ?? '')}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12 }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:border-[var(--accent)] transition-colors"
          >
            <span className="font-mono text-sm flex-1 text-left truncate">{address}</span>
            {copied ? <Check size={16} style={{ color: 'var(--accent)' }} /> : <Copy size={16} style={{ color: 'var(--text-muted)' }} />}
          </button>
        </div>

        {/* Request specific amount */}
        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-6 space-y-4">
          <p className="font-semibold text-left">Request Specific Amount</p>
          <div className="relative">
            <span style={{ color: 'var(--text-muted)', position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>$</span>
            <input
              type="number"
              placeholder="0"
              className="input-dark pl-8 text-xl font-bold"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select className="input-dark appearance-none pr-8" value={asset} onChange={e => setAsset(e.target.value)}>
                {['USDC', 'USDT', 'ETH'].map(a => <option key={a}>{a}</option>)}
              </select>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            <div className="relative">
              <select className="input-dark appearance-none pr-8" value={chain} onChange={e => setChain(e.target.value)}>
                {['Polygon', 'Ethereum', 'Base', 'Arbitrum'].map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Share link */}
        <button
          onClick={() => copy(paymentLink)}
          className="btn-accent w-full py-4 flex items-center justify-center gap-2"
        >
          {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Payment Link</>}
        </button>
        <p style={{ color: 'var(--text-muted)' }} className="text-xs break-all">{paymentLink}</p>
      </div>
    </div>
  );
}
