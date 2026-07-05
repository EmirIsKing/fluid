'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// @ts-ignore — SDK ships without bundled types in some installs
import { UniversalAccount } from '@particle-network/universal-account-sdk';
import {
  SUPPORTED_CHAIN_LABELS,
  resolveChainConfig,
  resolveTokenAddress,
  isSupportedAssetOnChain,
  usdToTokenAmount,
} from '@shared/chains';
import {
  normalizePrimaryAssets,
  signRootHash,
  collectEip7702Authorizations,
  validateRecipientAddress,
  estimateRoutePreview,
  type RoutePreview,
  type PrimaryAsset,
} from '@shared/particle-utils';
import { recordSendByWallet } from '@/app/actions/transactions';

export type { PrimaryAsset } from '@shared/particle-utils';

export type Transaction = {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  asset: string;
  chain: string;
  sourceAsset?: string;
  sourceChain?: string;
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
  primaryAssets: PrimaryAsset[];
  isUpgrading: boolean;
  isInitializing: boolean;
  activeChains: string[];
  transactions: Transaction[];
  contacts: Contact[];
  mode: 'demo' | 'live';
  particleConfigured: boolean;
  setMode: (mode: 'demo' | 'live') => void;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
  refreshAssets: () => Promise<void>;
  previewRoute: (usdAmount: number, asset: string, chain: string) => RoutePreview;
  sendPayment: (
    to: string,
    usdAmount: number,
    asset: string,
    chain: string,
    note?: string,
  ) => Promise<string>;
  delegateChain: (chainId: number, chainName: string) => Promise<void>;
};

const ParticleContext = createContext<ParticleState | undefined>(undefined);

const STORAGE_KEY = 'onepay_wallet';
const MODE_STORAGE_KEY = 'onepay_mode';
const TX_STORAGE_KEY = 'onepay_transactions';

const DEMO_ADDRESS = '0x9965507B1a0595C5411CC4457ED061b402C82F24';

const DEMO_ASSETS: PrimaryAsset[] = [
  { chainId: 8453, chainName: 'Base', symbol: 'ETH', tokenAddress: '0x0000000000000000000000000000000000000000', amount: '0.05', amountInUSD: '167.50' },
  { chainId: 8453, chainName: 'Base', symbol: 'USDC', tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', amount: '420.00', amountInUSD: '420.00' },
  { chainId: 42161, chainName: 'Arbitrum One', symbol: 'USDT', tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', amount: '180.00', amountInUSD: '180.00' },
  { chainId: 1, chainName: 'Ethereum', symbol: 'USDC', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '95.00', amountInUSD: '95.00' },
];

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Bob', username: 'bob', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', avatar: 'B', preferred: { asset: 'USDC', chain: 'Base' } },
  { id: '2', name: 'Alice', username: 'alice', address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', avatar: 'A', preferred: { asset: 'ETH', chain: 'Arbitrum One' } },
  { id: '3', name: 'Carol', username: 'carol', address: '0xdD2FD4581271e230360230F9337D7c0430Bf44C0', avatar: 'C', preferred: { asset: 'USDT', chain: 'Ethereum' } },
  { id: '4', name: 'David', username: 'david', address: '0xbDA5747bFD65F08fad54C695a769E55c7577f223', avatar: 'D', preferred: { asset: 'USDC', chain: 'BNB Chain' } },
];

function sumUsd(assets: PrimaryAsset[]): number {
  return assets.reduce((acc, a) => acc + (parseFloat(a.amountInUSD) || 0), 0);
}

function chainsFromAssets(assets: PrimaryAsset[]): string[] {
  const names = new Set<string>();
  for (const asset of assets) {
    names.add(resolveChainConfig(asset.chainName).label);
  }
  return [...names];
}

function loadStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function createUaInstance(ownerAddress: string) {
  if (!UniversalAccount || !process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID) return null;
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
    smartAccountOptions: {
      projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
      projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
      projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
      ownerAddress,
    },
  });
}

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  const particleConfigured = Boolean(
    process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY &&
    process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
  );

  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [primaryAssets, setPrimaryAssets] = useState<PrimaryAsset[]>([]);
  const [uaInstance, setUaInstance] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeChains, setActiveChains] = useState<string[]>(SUPPORTED_CHAIN_LABELS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setModeState] = useState<'demo' | 'live'>(particleConfigured ? 'live' : 'demo');
  const contacts = MOCK_CONTACTS;

  const persistWallet = useCallback((walletData: { address: string; balance: number; activeChains: string[] }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
  }, []);

  const persistTransactions = useCallback((txs: Transaction[]) => {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
  }, []);

  const setMode = (newMode: 'demo' | 'live') => {
    if (newMode === 'live' && !particleConfigured) {
      alert('Add Particle credentials to .env.local to use live mode.');
      return;
    }
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    disconnect();
  };

  const applyDemoState = useCallback(() => {
    const demoBalance = sumUsd(DEMO_ASSETS);
    setIsConnected(true);
    setAddress(DEMO_ADDRESS);
    setBalance(demoBalance);
    setPrimaryAssets(DEMO_ASSETS);
    setActiveChains(chainsFromAssets(DEMO_ASSETS));
    persistWallet({ address: DEMO_ADDRESS, balance: demoBalance, activeChains: chainsFromAssets(DEMO_ASSETS) });
  }, [persistWallet]);

  const refreshAssets = useCallback(async (userAddress?: string) => {
    const addr = userAddress ?? address;
    if (!addr) return;

    if (mode === 'demo') {
      setPrimaryAssets(DEMO_ASSETS);
      setBalance(sumUsd(DEMO_ASSETS));
      setActiveChains(chainsFromAssets(DEMO_ASSETS));
      return;
    }

    try {
      const ua = uaInstance ?? createUaInstance(addr);
      if (!ua) return;
      if (!uaInstance) setUaInstance(ua);

      const result = await ua.getPrimaryAssets();
      const assets = normalizePrimaryAssets(result?.assets ?? []);
      setPrimaryAssets(assets);
      setBalance(sumUsd(assets));
      setActiveChains(chainsFromAssets(assets));
      persistWallet({ address: addr, balance: sumUsd(assets), activeChains: chainsFromAssets(assets) });
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  }, [address, mode, uaInstance, persistWallet]);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as 'demo' | 'live' | 'testnet' | null;
      if (savedMode === 'demo' || savedMode === 'live') {
        setModeState(savedMode);
      } else if (!particleConfigured) {
        setModeState('demo');
      }

      setTransactions(loadStoredTransactions());

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { address: savedAddress, balance: savedBalance, activeChains: savedChains } = JSON.parse(saved);
        setIsConnected(true);
        setAddress(savedAddress);
        setBalance(savedBalance);
        setActiveChains(savedChains?.length ? savedChains : SUPPORTED_CHAIN_LABELS);

        const effectiveMode = savedMode === 'demo' ? 'demo' : mode;
        if (effectiveMode === 'demo') {
          setPrimaryAssets(DEMO_ASSETS);
        } else if (savedAddress) {
          const ua = createUaInstance(savedAddress);
          if (ua) setUaInstance(ua);
        }
      }
    } catch {
      /* ignore corrupt storage */
    } finally {
      setIsInitializing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      refreshAssets(address);
      const interval = setInterval(() => refreshAssets(address), 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, refreshAssets]);

  const connect = async (_walletType: string) => {
    setIsUpgrading(true);

    if (mode === 'demo') {
      applyDemoState();
      setIsUpgrading(false);
      return;
    }

    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setIsUpgrading(false);
      alert('MetaMask is not installed.');
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts[0];
      const ua = createUaInstance(userAddress);
      if (ua) setUaInstance(ua);

      let assets: PrimaryAsset[] = [];
      if (ua) {
        try {
          const result = await ua.getPrimaryAssets();
          assets = normalizePrimaryAssets(result?.assets ?? []);
        } catch {
          /* balance may be zero on new accounts */
        }
      }

      const total = sumUsd(assets);
      const chains = chainsFromAssets(assets);
      setIsConnected(true);
      setAddress(userAddress);
      setBalance(total);
      setPrimaryAssets(assets);
      setActiveChains(chains);
      persistWallet({ address: userAddress, balance: total, activeChains: chains });
    } catch (e) {
      console.error('MetaMask/UniversalAccount connection failed', e);
      alert('Failed to connect to MetaMask.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
    setPrimaryAssets([]);
    setUaInstance(null);
    setActiveChains(SUPPORTED_CHAIN_LABELS);
    localStorage.removeItem(STORAGE_KEY);
  };

  const previewRoute = useCallback(
    (usdAmount: number, asset: string, chain: string): RoutePreview =>
      estimateRoutePreview(primaryAssets, usdAmount, asset, chain),
    [primaryAssets],
  );

  const appendTransaction = useCallback(
    (tx: Transaction) => {
      setTransactions(prev => {
        const next = [tx, ...prev];
        persistTransactions(next);
        return next;
      });
    },
    [persistTransactions],
  );

  const sendPayment = async (
    to: string,
    usdAmount: number,
    asset: string,
    chain: string,
    note?: string,
  ): Promise<string> => {
    if (usdAmount <= 0) throw new Error('Amount must be greater than zero.');
    if (usdAmount > balance) throw new Error('Amount exceeds your unified balance.');

    const chainConfig = resolveChainConfig(chain);
    if (!isSupportedAssetOnChain(chainConfig.value, asset)) {
      throw new Error(`${asset} is not available on ${chainConfig.label}.`);
    }

    const resolved = resolveRecipient(to, contacts);
    const recipientAddress = validateRecipientAddress(to, resolved?.address);

    const route = previewRoute(usdAmount, asset, chainConfig.value);
    const tokenAmount = route.tokenAmount;

    if (mode === 'demo') {
      await new Promise(r => setTimeout(r, 1200));
      const txHash = `demo-${Date.now().toString(16)}`;
      appendTransaction({
        id: 'tx' + Date.now(),
        type: 'sent',
        amount: usdAmount,
        asset: asset.toUpperCase(),
        chain: chainConfig.label,
        sourceAsset: route.sourceAsset,
        sourceChain: route.sourceChain,
        toName: resolved?.name ?? recipientAddress.slice(0, 8),
        to: recipientAddress,
        date: 'Just now',
        status: 'completed',
        txHash,
      });
      return txHash;
    }

    if (typeof window === 'undefined' || !(window as any).ethereum || !address) {
      throw new Error('MetaMask is not connected or installed');
    }
    if (!uaInstance) throw new Error('Universal Account is not initialized.');

    const tokenAddress = resolveTokenAddress(chainConfig.value, asset);

    try {
      const transaction = await uaInstance.createTransferTransaction({
        token: {
          chainId: chainConfig.chainId,
          address: tokenAddress,
        },
        amount: tokenAmount,
        receiver: recipientAddress,
      });

      const signature = await signRootHash(transaction.rootHash, address);
      const authorizations = await collectEip7702Authorizations(transaction, address);

      const result = authorizations.length
        ? await uaInstance.sendTransaction(transaction, signature, authorizations)
        : await uaInstance.sendTransaction(transaction, signature);

      const txHash = result.transactionId ?? result.txHash ?? String(result);

      appendTransaction({
        id: 'tx' + Date.now(),
        type: 'sent',
        amount: usdAmount,
        asset: asset.toUpperCase(),
        chain: chainConfig.label,
        sourceAsset: route.sourceAsset,
        sourceChain: route.sourceChain,
        toName: resolved?.name ?? recipientAddress.slice(0, 8),
        to: recipientAddress,
        date: 'Just now',
        status: 'completed',
        txHash,
      });

      recordSendByWallet({
        senderAddress: address,
        recipientAddress,
        token: asset.toUpperCase(),
        amount: tokenAmount,
        sourceChain: route.sourceChain,
        destinationChain: chainConfig.label,
        transactionHash: txHash,
        note,
      }).catch(() => undefined);

      setTimeout(() => refreshAssets(address), 8000);
      return txHash;
    } catch (err: any) {
      console.error('[Particle UA] Transfer transaction failed:', err);
      throw new Error(err.message || 'Transfer failed');
    }
  };

  const delegateChain = async (chainId: number, chainName: string) => {
    if (mode === 'demo') {
      await new Promise(r => setTimeout(r, 800));
      return;
    }
    if (!uaInstance || !address) throw new Error('Connect your wallet first.');
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask is not available.');
    }

    const chainConfig = SUPPORTED_CHAIN_LABELS.map(resolveChainConfig).find(c => c.chainId === chainId);
    if (!chainConfig) throw new Error('Unsupported chain.');

    const tokenAddress = resolveTokenAddress(chainConfig.value, 'USDC');
    const transaction = await uaInstance.createTransferTransaction({
      token: { chainId: chainConfig.chainId, address: tokenAddress },
      amount: '0.000001',
      receiver: address,
    });

    const signature = await signRootHash(transaction.rootHash, address);
    const authorizations = await collectEip7702Authorizations(transaction, address);
    if (authorizations.length) {
      await uaInstance.sendTransaction(transaction, signature, authorizations);
    } else {
      await uaInstance.sendTransaction(transaction, signature);
    }

    console.info(`EIP-7702 authorization completed for ${chainName}`);
  };

  return (
    <ParticleContext.Provider
      value={{
        isConnected,
        address,
        balance,
        primaryAssets,
        isUpgrading,
        isInitializing,
        activeChains,
        transactions,
        contacts,
        mode,
        particleConfigured,
        setMode,
        connect,
        disconnect,
        refreshAssets,
        previewRoute,
        sendPayment,
        delegateChain,
      }}
    >
      {children}
    </ParticleContext.Provider>
  );
}

export function useParticle() {
  const ctx = useContext(ParticleContext);
  if (!ctx) throw new Error('useParticle must be used within ParticleProvider');
  return ctx;
}

export function resolveRecipient(input: string, contacts: Contact[]): Contact | null {
  const query = input.startsWith('@') ? input.slice(1).toLowerCase() : input.toLowerCase();
  return contacts.find(c => c.username.toLowerCase() === query || c.name.toLowerCase() === query) ?? null;
}
