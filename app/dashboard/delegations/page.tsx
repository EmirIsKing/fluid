'use client';

import React from 'react';
import { EIP7702DelegationStatus } from '@/components/EIP7702DelegationStatus';
import { useParticle } from '@/components/ParticleProvider';

export default function DelegationsPage() {
  const { delegateChain } = useParticle();

  const handleDelegate = async (chainId: number) => {
    await delegateChain(chainId, '');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Delegation Management</h1>
      <p className="text-gray-600 max-w-2xl">
        Authorize EIP-7702 on each chain so Particle can route cross-chain payments and sponsor gas from your Primary Assets.
      </p>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        <EIP7702DelegationStatus onDelegate={handleDelegate} />
      </div>
    </div>
  );
}
