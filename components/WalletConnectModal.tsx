'use client';

import { useState, useEffect } from 'react';
import { useParticle } from '@/components/ParticleProvider';
import { useRouter } from 'next/navigation';

type Step = 'choose' | 'upgrading' | 'done';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect, isUpgrading, isConnected } = useParticle();
  const [step, setStep] = useState<Step>('choose');
  const router = useRouter();

  useEffect(() => {
    if (isUpgrading) setStep('upgrading');
    if (isConnected && step === 'upgrading') {
      setStep('done');
      setTimeout(() => {
        onClose();
        router.push('/dashboard');
      }, 1800);
    }
  }, [isUpgrading, isConnected]);

  if (!isOpen) return null;

  const handleMetaMask = async () => {
    await connect('metamask');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-3xl p-8 fade-in-up"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {step === 'choose' && (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                Connect your wallet to enable Universal Account payments
              </p>
            </div>

            <button
              onClick={handleMetaMask}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:border-[var(--accent)] transition-colors group mb-4"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: '#1c1c26' }}>
                🦊
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold">MetaMask</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs">Recommended</p>
              </div>
              <span style={{ color: 'var(--accent)' }} className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Connect →</span>
            </button>

            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 14 }}
              className="p-4 mt-6">
              <p style={{ color: 'var(--accent)' }} className="text-xs font-semibold mb-1">✦ EIP-7702 Universal Account</p>
              <p style={{ color: 'var(--text-subtle)' }} className="text-xs leading-relaxed">
                Your existing wallet will be upgraded to support cross-chain payments. 
                Keep your address, assets, and keys — just gain superpowers.
              </p>
            </div>

            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
              className="w-full text-center text-sm mt-4 hover:text-white transition-colors py-2">
              Cancel
            </button>
          </>
        )}

        {step === 'upgrading' && (
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent)] opacity-20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[var(--accent)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">⚡</div>
            </div>
            <h3 className="text-xl font-bold mb-2">Upgrading to Universal Account</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-6">EIP-7702 delegation in progress...</p>
            <div className="space-y-3 text-left">
              {['Connecting MetaMask', 'Delegating EOA via EIP-7702', 'Activating Universal Account'].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--accent)', color: '#000' }}>✓</div>
                  <span style={{ color: 'var(--text-subtle)' }} className="text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)' }}>
              ✓
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Universal Account Active</h3>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
