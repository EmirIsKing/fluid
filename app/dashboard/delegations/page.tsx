'use client';

import React from 'react';
import { EIP7702DelegationStatus } from '@/components/EIP7702DelegationStatus';

export default function DelegationsPage() {
  const handleDelegate = async (chainId: number) => {
    // In a real app, we'd trigger the Universal Account SDK here
    console.log('Delegating for chain:', chainId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Delegation Management</h1>
      <p className="text-gray-600 max-w-2xl">
        Manage your EIP-7702 delegations to enable gasless transactions, batching, and cross-chain capabilities per network.
      </p>
      
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        <EIP7702DelegationStatus onDelegate={handleDelegate} />
      </div>
    </div>
  );
}
