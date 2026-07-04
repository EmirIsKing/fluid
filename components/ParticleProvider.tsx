'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

let UniversalAccount: any;
if (typeof window !== 'undefined') {
  try {
    const sdk = require('@particle-network/universal-account-sdk');
    UniversalAccount = sdk.UniversalAccount;
  } catch (e) {
    console.error('Failed to load @particle-network/universal-account-sdk', e);
  }
}

export type Transaction = {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  asset: string;
  chain: string;
  to?: string;
  from?: string;
  toName?: string;
  fromName?: string;
  date: string;
  status: 'completed' | 'pending';
  txHash?: string;
};

export type Contact = {
  id: string;
  name: string;
  username: string;
  address: string;
  avatar: string;
  preferred: { asset: string; chain: string };
};

type ParticleState = {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isUpgrading: boolean;
  isInitializing: boolean;
  activeChains: string[];
  transactions: Transaction[];
  contacts: Contact[];
  mode: 'demo' | 'testnet';
  setMode: (mode: 'demo' | 'testnet') => void;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
  sendPayment: (to: string, amount: number, asset: string, chain: string, note?: string) => Promise<string>;
};

const ParticleContext = createContext<ParticleState | undefined>(undefined);

const STORAGE_KEY = 'onepay_wallet';
const MODE_STORAGE_KEY = 'onepay_mode';

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Bob', username: 'bob', address: '0xBob123...', avatar: 'B', preferred: { asset: 'USDC', chain: 'Polygon' } },
  { id: '2', name: 'Alice', username: 'alice', address: '0xAlice456...', avatar: 'A', preferred: { asset: 'ETH', chain: 'Base' } },
  { id: '3', name: 'Carol', username: 'carol', address: '0xCarol789...', avatar: 'C', preferred: { asset: 'USDT', chain: 'Arbitrum' } },
  { id: '4', name: 'David', username: 'david', address: '0xDavid321...', avatar: 'D', preferred: { asset: 'USDC', chain: 'Ethereum' } },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'sent', amount: 50, asset: 'USDC', chain: 'Polygon', toName: 'Bob', date: 'Today, 2:34 PM', status: 'completed', txHash: '0xabc...' },
  { id: 'tx2', type: 'received', amount: 120, asset: 'ETH', chain: 'Base', fromName: 'Alice', date: 'Yesterday, 11:00 AM', status: 'completed', txHash: '0xdef...' },
  { id: 'tx3', type: 'sent', amount: 25, asset: 'USDT', chain: 'Arbitrum', toName: 'Carol', date: 'Jul 29, 4:20 PM', status: 'completed', txHash: '0xghi...' },
];

const UA_SUPPORTED_CHAINS: Record<string, { chainId: number; name: string }> = {
  'ethereum': { chainId: 1, name: 'Ethereum' },
  'base': { chainId: 8453, name: 'Base' },
  'arbitrum': { chainId: 42161, name: 'Arbitrum One' },
  'bnb': { chainId: 56, name: 'BNB Chain' },
  'x layer': { chainId: 196, name: 'X Layer' }
};

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [uaInstance, setUaInstance] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeChains, setActiveChains] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [mode, setModeState] = useState<'demo' | 'testnet'>('testnet');
  const contacts = MOCK_CONTACTS;

  const setMode = (newMode: 'demo' | 'testnet') => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    disconnect();
  };

  const refreshBalance = async (userAddress: string) => {
    if (!userAddress) return;
    try {
      if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID) {
        const ua = new UniversalAccount({
          projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
          projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
          projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
          ownerAddress: userAddress,
        });
        const result = await ua.getPrimaryAssets();
        if (result && result.assets) {
          const totalUsdBalance = result.assets.reduce(
            (acc: number, asset: any) => acc + (parseFloat(asset.amountInUSD) || 0),
            0
          );
          setBalance(totalUsdBalance);
        }
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  };

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as 'demo' | 'testnet';
      if (savedMode) setModeState(savedMode);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { address, balance, activeChains } = JSON.parse(saved);
        setIsConnected(true);
        setAddress(address);
        setBalance(balance);
        setActiveChains(activeChains);

        if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID && address) {
          const ua = new UniversalAccount({
            projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
            projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
            projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
            ownerAddress: address,
          });
          setUaInstance(ua);
        }
      }
    } catch { } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      refreshBalance(address);
      const interval = setInterval(() => {
        refreshBalance(address);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address]);

  const connect = async (walletType: string) => {
    setIsUpgrading(true);

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        let ua: any = null;
        let fetchedBalance = 0;

        if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID) {
          ua = new UniversalAccount({
            projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
            projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
            projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
            ownerAddress: userAddress,
          });
          setUaInstance(ua);

          try {
            const result = await ua.getPrimaryAssets();
            if (result && result.assets) {
              fetchedBalance = result.assets.reduce(
                (acc: number, asset: any) => acc + (parseFloat(asset.amountInUSD) || 0),
                0
              );
            }
          } catch {}
        }

        const walletData = {
          address: userAddress,
          balance: fetchedBalance,
          activeChains: ['Ethereum', 'Base', 'Arbitrum One', 'BNB Chain', 'X Layer'],
        };

        setIsConnected(true);
        setAddress(walletData.address);
        setBalance(walletData.balance);
        setActiveChains(walletData.activeChains);
        setIsUpgrading(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
      } catch (e) {
        console.error('MetaMask/UniversalAccount connection failed', e);
        setIsUpgrading(false);
        alert('Failed to connect to MetaMask.');
      }
    } else {
      setIsUpgrading(false);
      alert('MetaMask is not installed.');
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
    setActiveChains([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const sendPayment = async (to: string, amount: number, asset: string, chain: string, note?: string): Promise<string> => {
    if (typeof window !== 'undefined' && (window as any).ethereum && address) {
      // Resolve recipient address
      let recipientAddress = to;
      const resolved = resolveRecipient(to, contacts);
      if (resolved) {
        recipientAddress = resolved.address;
      }

      // Check if the address is a mock one (like '0xBob123...')
      if (!recipientAddress.startsWith('0x') || recipientAddress.includes('.')) {
        recipientAddress = '0x9965507B1a0595C5411CC4457ED061b402C82F24';
      }

      const chainKey = chain.toLowerCase();
      const targetChainInfo = UA_SUPPORTED_CHAINS[chainKey] || { chainId: 8453, name: 'Base' };

      if (uaInstance) {
        try {
          const transaction = await uaInstance.createConvertTransaction({
            expectToken: {
              type: asset.toLowerCase(),
              amount: amount.toString(),
            },
            chainId: targetChainInfo.chainId,
          });

          const signature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [transaction.rootHash, address],
          });

          const result = await uaInstance.sendTransaction(transaction, signature);
          const txHash = result.transactionId;

          const newTx: Transaction = {
            id: 'tx' + Date.now(),
            type: 'sent',
            amount,
            asset,
            chain: targetChainInfo.name,
            toName: resolved ? resolved.name : to.substring(0, 8),
            to: recipientAddress,
            date: 'Just now',
            status: 'completed',
            txHash,
          };

          setTransactions(prev => [newTx, ...prev]);
          setTimeout(() => refreshBalance(address), 8000);
          return txHash;
        } catch (err: any) {
          console.error('[Particle UA] Cross-chain convert transaction failed:', err);
          throw new Error(err.message || 'Cross-chain swap failed');
        }
      }
      throw new Error('Universal Account instance is not initialized.');

    } else {
      throw new Error('MetaMask is not connected or installed');
    }
  };

  return (
    <ParticleContext.Provider value={{
      isConnected, address, balance, isUpgrading, isInitializing, activeChains,
      transactions, contacts, mode, setMode, connect, disconnect, sendPayment,
    }}>
      {children}
    </ParticleContext.Provider>
  );
}

export function useParticle() {
  const ctx = useContext(ParticleContext);
  if (!ctx) throw new Error('useParticle must be used within ParticleProvider');
  return ctx;
}

// Resolve @username to a contact
export function resolveRecipient(input: string, contacts: Contact[]): Contact | null {
  const query = input.startsWith('@') ? input.slice(1).toLowerCase() : input.toLowerCase();
  return contacts.find(c => c.username.toLowerCase() === query || c.name.toLowerCase() === query) ?? null;
}
