'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Dynamically import UniversalAccount to prevent Next.js SSR build errors
let UniversalAccount: any;
if (typeof window !== 'undefined') {
  try {
    UniversalAccount = require('@particle-network/universal-account-sdk').UniversalAccount;
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

// All Particle Network co-testnet supported chains for routing
const UA_SUPPORTED_CHAINS: Record<string, { chainId: number; rpc: string; name: string }> = {
  // Arbitrum
  'arbitrum sepolia': { chainId: 421614, rpc: 'https://sepolia-rollup.arbitrum.io/rpc', name: 'Arbitrum Sepolia' },
  'arbitrum': { chainId: 421614, rpc: 'https://sepolia-rollup.arbitrum.io/rpc', name: 'Arbitrum Sepolia' },
  // Base
  'base sepolia': { chainId: 84532, rpc: 'https://sepolia.base.org', name: 'Base Sepolia' },
  'base': { chainId: 84532, rpc: 'https://sepolia.base.org', name: 'Base Sepolia' },
  // Linea
  'linea sepolia': { chainId: 59141, rpc: 'https://rpc.sepolia.linea.build', name: 'Linea Sepolia' },
  'linea': { chainId: 59141, rpc: 'https://rpc.sepolia.linea.build', name: 'Linea Sepolia' },
  // Avalanche
  'avalanche fuji': { chainId: 43113, rpc: 'https://api.avax-test.network/ext/bc/C/rpc', name: 'Avalanche Fuji' },
  'avalanche': { chainId: 43113, rpc: 'https://api.avax-test.network/ext/bc/C/rpc', name: 'Avalanche Fuji' },
  // BNB Chain
  'bnb chain': { chainId: 97, rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/', name: 'BNB Testnet' },
  'bnb': { chainId: 97, rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/', name: 'BNB Testnet' },
  // Berachain
  'berachain': { chainId: 80084, rpc: 'https://artio.rpc.berachain.com/', name: 'Berachain bArtio' },
  // Monad
  'monad': { chainId: 10143, rpc: 'https://testnet-rpc.monad.xyz', name: 'Monad Testnet' },
  'monad testnet': { chainId: 10143, rpc: 'https://testnet-rpc.monad.xyz', name: 'Monad Testnet' },
  // Taiko
  'taiko': { chainId: 167009, rpc: 'https://rpc.hekla.taiko.xyz', name: 'Taiko Hekla' },
  'taiko hekla': { chainId: 167009, rpc: 'https://rpc.hekla.taiko.xyz', name: 'Taiko Hekla' },
  // Zircuit
  'zircuit': { chainId: 48899, rpc: 'https://zircuit1-testnet.p2pify.com', name: 'Zircuit Testnet' },
  // Polygon
  'polygon amoy': { chainId: 80002, rpc: 'https://rpc-amoy.polygon.technology', name: 'Polygon Amoy' },
  'polygon': { chainId: 80002, rpc: 'https://rpc-amoy.polygon.technology', name: 'Polygon Amoy' },
};

// Chains to scan for native token balance — any testnet the user might hold assets on
const ALL_TESTNET_CHAINS = [
  { name: 'Monad Testnet',    rpc: 'https://testnet-rpc.monad.xyz' },
  { name: 'Arbitrum Sepolia', rpc: 'https://sepolia-rollup.arbitrum.io/rpc' },
  { name: 'Base Sepolia',     rpc: 'https://sepolia.base.org' },
  { name: 'Linea Sepolia',    rpc: 'https://rpc.sepolia.linea.build' },
  { name: 'Avalanche Fuji',   rpc: 'https://api.avax-test.network/ext/bc/C/rpc' },
  { name: 'BNB Testnet',      rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545/' },
  { name: 'Berachain bArtio', rpc: 'https://artio.rpc.berachain.com/' },
  { name: 'Taiko Hekla',      rpc: 'https://rpc.hekla.taiko.xyz' },
  { name: 'Zircuit Testnet',  rpc: 'https://zircuit1-testnet.p2pify.com' },
  { name: 'Polygon Amoy',     rpc: 'https://rpc-amoy.polygon.technology' },
];

async function fetchBalanceOnChain(address: string, rpcUrl: string): Promise<number> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
    });
    const data = await res.json();
    if (data && data.result) return Number(BigInt(data.result)) / 1e18;
  } catch {}
  return 0;
}

async function fetchUniversalBalance(address: string): Promise<{ total: number; breakdown: Record<string, number> }> {
  const breakdown: Record<string, number> = {};
  let total = 0;
  await Promise.all(
    ALL_TESTNET_CHAINS.map(async c => {
      const bal = await fetchBalanceOnChain(address, c.rpc);
      breakdown[c.name] = bal;
      total += bal;
    })
  );
  return { total, breakdown };
}


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
      // Aggregate balance across all supported testnet chains
      const { total } = await fetchUniversalBalance(userAddress);

      // Also try to get UA primary assets (supported chains only)
      let uaAssetBalance = 0;
      if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID) {
        try {
          const ua = new UniversalAccount({
            projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
            projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
            projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
            ownerAddress: userAddress,
          });
          const assets = await ua.getPrimaryAssets();
          if (assets && assets.length > 0) {
            uaAssetBalance = assets.reduce((acc: number, a: any) => acc + (parseFloat(a.amount) || 0), 0);
          }
        } catch { /* UA may not have assets yet */ }
      }

      const fetchedBalance = total + uaAssetBalance;
      setBalance(fetchedBalance);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.balance = fetchedBalance;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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

        // Re-initialize Particle Universal Account instance
        if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID && address) {
          try {
            const ua = new UniversalAccount({
              projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
              projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
              projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
              ownerAddress: address,
            });
            setUaInstance(ua);
          } catch (e) {
            console.error('Failed to re-initialize Universal Account:', e);
          }
        }
      }
    } catch {} finally {
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
        // Request MetaMask account — stay on whatever chain the user is on
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // Simulate EIP-7702 upgrade flow delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Aggregate balance across all supported testnet chains
        const { total: nativeBalance } = await fetchUniversalBalance(userAddress);
        const chainsList = ALL_TESTNET_CHAINS.map(c => c.name);

        // Initialize Particle Universal Account
        let ua: any = null;
        let uaBalance = 0;
        if (UniversalAccount && process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID) {
          try {
            ua = new UniversalAccount({
              projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
              projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
              projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
              ownerAddress: userAddress,
            });
            setUaInstance(ua);
            const assets = await ua.getPrimaryAssets();
            if (assets && assets.length > 0) {
              uaBalance = assets.reduce((acc: number, a: any) => acc + (parseFloat(a.amount) || 0), 0);
            }
          } catch { /* UA may not have indexed assets yet */ }
        }

        const walletData = {
          address: userAddress,
          balance: nativeBalance + uaBalance,
          activeChains: chainsList,
        };

        setIsConnected(true);
        setAddress(walletData.address);
        setBalance(walletData.balance);
        setActiveChains(walletData.activeChains);
        setIsUpgrading(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
        return;
      } catch (e) {
        console.error('MetaMask/UniversalAccount connection failed', e);
        setIsUpgrading(false);
        alert('Failed to connect to MetaMask. Make sure it is installed and unlocked.');
        return;
      }
    } else {
      setIsUpgrading(false);
      alert('MetaMask is not installed. Please install it to use Live Testnet Mode.');
      return;
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

      // Try Particle Universal Account cross-chain convert transaction
      // UA v2 supports: Base Sepolia (84532), Polygon Amoy (80002), and mainnets
      const chainKey = chain.toLowerCase();
      const targetChainInfo = UA_SUPPORTED_CHAINS[chainKey];

      if (uaInstance && targetChainInfo) {
        try {
          console.log(`[Particle UA] Creating cross-chain convert transaction → ${targetChainInfo.name}`);

          const transaction = await uaInstance.createConvertTransaction({
            expectToken: {
              type: asset.toUpperCase(),
              amount: amount.toString(),
            },
            chainId: targetChainInfo.chainId,
          });

          // Sign the rootHash using MetaMask personal_sign
          const signature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [transaction.rootHash, address],
          });

          // Broadcast via Particle
          const result = await uaInstance.sendTransaction(transaction, signature);
          const txHash = result.transactionId;
          console.log('[Particle UA] Cross-chain swap submitted!', txHash);

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
          console.warn('[Particle UA] Cross-chain swap failed, falling back to direct MetaMask transfer:', err?.message || err);
        }
      }

      // Fallback: direct MetaMask native transfer on the user's current network
      try {
        const amountInWei = BigInt(Math.floor(amount * 1e18));
        const valueHex = '0x' + amountInWei.toString(16);

        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: address, to: recipientAddress, value: valueHex }],
        });

        const newTx: Transaction = {
          id: 'tx' + Date.now(),
          type: 'sent',
          amount,
          asset,
          chain,
          toName: resolved ? resolved.name : to.substring(0, 8),
          to: recipientAddress,
          date: 'Just now',
          status: 'completed',
          txHash,
        };

        setTransactions(prev => [newTx, ...prev]);
        setTimeout(() => refreshBalance(address), 5000);
        return txHash;
      } catch (error) {
        console.error('Failed to send transaction via MetaMask:', error);
        throw error;
      }
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
