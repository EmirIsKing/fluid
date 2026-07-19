'use client';

import { getBytes, verifyMessage, Signature } from 'ethers';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// @ts-ignore — SDK ships without bundled types in some installs
import { UniversalAccount, UNIVERSAL_ACCOUNT_VERSION, CHAIN_ID, } from '@particle-network/universal-account-sdk';
import {
  SUPPORTED_CHAIN_LABELS,
  resolveChainConfig,
  resolveTokenAddress,
  isSupportedAssetOnChain,
  usdToTokenAmount,
  FALLBACK_USD_PRICES,
  type SupportedAsset,
} from '@shared/chains';
import {
  normalizePrimaryAssets,
  signRootHash,
  validateRecipientAddress,
  estimateRoutePreview,
  getAssetUsdPrice,
  type RoutePreview,
  type PrimaryAsset,
  useSignRootHash,
} from '@shared/particle-utils';
import { recordSendByWallet } from '@/app/actions/transactions';
import { usePrivy, useWallets, useSign7702Authorization } from '@privy-io/react-auth';

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
  ownerAddress: string | null;
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
  delegateChain: (chainId: number, chainName: string) => Promise<void>;
  send: (receiver: string, amount: string, asset: string, chain: string) => Promise<any>;
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
  const projId = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY || process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const appId = process.env.NEXT_PUBLIC_APP_ID || process.env.NEXT_PUBLIC_PARTICLE_APP_UUID;

  if (!UniversalAccount || !projId || !appId) return null;

  return new UniversalAccount({
    projectId: projId,
    projectClientKey: clientKey,
    ownerAddress: ownerAddress.toLowerCase(),
    tradeConfig: {
      slippageBps: 100,      // 1% slippage tolerance
    },
    smartAccountOptions: {
      ownerAddress: ownerAddress.toLowerCase(),
      useEIP7702: true,
    },
  });
}


export function ParticleProvider({ children }: { children: React.ReactNode }) {
  const particleConfigured = Boolean(
    process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY &&
    process.env.NEXT_PUBLIC_PARTICLE_APP_UUID,
  );

  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0];
  const { signAuthorization } = useSign7702Authorization();

  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [primaryAssets, setPrimaryAssets] = useState<PrimaryAsset[]>([]);
  const [uaInstance, setUaInstance] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeChains, setActiveChains] = useState<string[]>(SUPPORTED_CHAIN_LABELS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mode, setModeState] = useState<'demo' | 'live'>(particleConfigured ? 'live' : 'demo');
  const contacts = MOCK_CONTACTS;

  const persistWallet = useCallback((walletData: { address: string; ownerAddress: string; balance: number; activeChains: string[] }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(walletData));
  }, []);

  const persistTransactions = useCallback((txs: Transaction[]) => {
    localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txs));
  }, []);

  // Synchronize loading/initialization status from Privy
  useEffect(() => {
    if (mode === 'live') {
      if (ready) {
        setIsInitializing(false);
      }
    } else {
      setIsInitializing(false);
    }
  }, [ready, mode]);

  // Synchronize credentials and active UniversalAccount instances when Privy updates
  useEffect(() => {
    if (mode === 'live') {
      if (authenticated && activeWallet) {
        activeWallet.getEthereumProvider().then((provider) => {
          (window as any).ethereum = provider;
          const ownerAddr = activeWallet.address.toLowerCase();
          setOwnerAddress(ownerAddr);
          setIsConnected(true);

          const ua = createUaInstance(ownerAddr);
          if (ua) {
            setUaInstance(ua);
          }
        }).catch((err) => {
          console.error('[ParticleProvider] failed to get EIP-1193 provider from Privy:', err);
        });
      } else if (ready && !authenticated) {
        setIsConnected(false);
        setAddress(null);
        setOwnerAddress(null);
        setBalance(0);
        setPrimaryAssets([]);
        setUaInstance(null);
        setActiveChains(SUPPORTED_CHAIN_LABELS);
      }
    }
  }, [authenticated, activeWallet, ready, mode]);

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
    const savedDemo = localStorage.getItem('onepay_demo_assets');
    let currentDemoAssets = DEMO_ASSETS;
    if (savedDemo) {
      try {
        currentDemoAssets = JSON.parse(savedDemo);
      } catch { }
    }
    const demoBalance = sumUsd(currentDemoAssets);
    setIsConnected(true);
    setAddress(DEMO_ADDRESS);
    setOwnerAddress(DEMO_ADDRESS);
    setBalance(demoBalance);
    setPrimaryAssets(currentDemoAssets);
    setActiveChains(chainsFromAssets(currentDemoAssets));
    persistWallet({ address: DEMO_ADDRESS, ownerAddress: DEMO_ADDRESS, balance: demoBalance, activeChains: chainsFromAssets(currentDemoAssets) });
  }, [persistWallet]);

  const refreshAssets = useCallback(async (userOwnerAddress?: string) => {
    const ownerAddr = userOwnerAddress ?? ownerAddress;
    if (!ownerAddr) return;

    if (mode === 'demo') {
      const savedDemo = localStorage.getItem('onepay_demo_assets');
      let currentDemoAssets = DEMO_ASSETS;
      if (savedDemo) {
        try {
          currentDemoAssets = JSON.parse(savedDemo);
        } catch { }
      }
      setPrimaryAssets(currentDemoAssets);
      setBalance(sumUsd(currentDemoAssets));
      setActiveChains(chainsFromAssets(currentDemoAssets));
      return;
    }

    try {
      const ua = uaInstance ?? createUaInstance(ownerAddr);
      if (!ua) return;
      if (!uaInstance) setUaInstance(ua);

      const smartOptions = await ua.getSmartAccountOptions();
      const smartAccountAddress = (smartOptions.smartAccountAddress ?? ownerAddr).toLowerCase();

      const result = await ua.getPrimaryAssets();
      // console.log("[ParticleProvider] refreshAssets Result:", JSON.stringify(result, null, 2));
      const rawAssets = Array.isArray(result) ? result : (result?.assets || []);
      const assets = normalizePrimaryAssets(rawAssets);
      setPrimaryAssets(assets);
      setBalance(sumUsd(assets));
      setAddress(smartAccountAddress);
      setActiveChains(chainsFromAssets(assets));
      persistWallet({ address: smartAccountAddress, ownerAddress: ownerAddr, balance: sumUsd(assets), activeChains: chainsFromAssets(assets) });
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  }, [ownerAddress, mode, uaInstance, persistWallet]);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as 'demo' | 'live' | 'testnet' | null;
      if (savedMode === 'demo' || savedMode === 'live') {
        setModeState(savedMode);
      } else if (!particleConfigured) {
        setModeState('demo');
      }

      setTransactions(loadStoredTransactions());

      const effectiveMode = (savedMode === 'demo' || (!savedMode && !particleConfigured)) ? 'demo' : 'live';
      if (effectiveMode === 'demo') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { address: savedAddress, ownerAddress: savedOwnerAddress, balance: savedBalance, activeChains: savedChains } = JSON.parse(saved);
          setIsConnected(true);
          setAddress(savedAddress.toLowerCase());
          setOwnerAddress((savedOwnerAddress ?? savedAddress).toLowerCase());
          setBalance(savedBalance);
          setActiveChains(savedChains?.length ? savedChains : SUPPORTED_CHAIN_LABELS);

          const savedDemo = localStorage.getItem('onepay_demo_assets');
          if (savedDemo) {
            try {
              setPrimaryAssets(JSON.parse(savedDemo));
            } catch {
              setPrimaryAssets(DEMO_ASSETS);
            }
          } else {
            setPrimaryAssets(DEMO_ASSETS);
          }
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected && ownerAddress) {
      refreshAssets(ownerAddress);
      const interval = setInterval(() => refreshAssets(ownerAddress), 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected, ownerAddress, refreshAssets]);

  const connect = async (walletType: string) => {
    setIsUpgrading(true);

    if (mode === 'demo') {
      applyDemoState();
      setIsUpgrading(false);
      return;
    }

    try {
      await login();
    } catch (e) {
      console.error('Privy login failed', e);
      alert('Failed to connect wallet.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const disconnect = () => {
    if (mode === 'demo') {
      setIsConnected(false);
      setAddress(null);
      setOwnerAddress(null);
      setBalance(0);
      setPrimaryAssets([]);
      setUaInstance(null);
      setActiveChains(SUPPORTED_CHAIN_LABELS);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      logout();
    }
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


  const signHash = useSignRootHash();
  const delegateChain = async (chainId: number, chainName: string) => {
    if (mode === 'demo') {
      await new Promise(r => setTimeout(r, 800));
      return;
    }
    if (!uaInstance || !ownerAddress) throw new Error('Connect your wallet first.');

    const chainConfig = SUPPORTED_CHAIN_LABELS.map(resolveChainConfig).find(c => c.chainId === chainId);
    if (!chainConfig) throw new Error('Unsupported chain.');

    const tokenAddress = resolveTokenAddress(chainConfig.value, 'USDC');
    const transaction = await uaInstance.createTransferTransaction({
      token: { chainId: chainConfig.chainId, address: tokenAddress },
      amount: '0.000001',
      receiver: ownerAddress,
    });

    const signature = await signHash(transaction.rootHash);
    console.log('Signature:', signature);

    const authorizations: any[] = [];
    if (transaction.userOps?.length) {
      for (const userOp of transaction.userOps) {
        if (userOp.eip7702Auth && !userOp.eip7702Delegated) {
          const auth = await signAuthorization({
            contractAddress: userOp.eip7702Auth.address,
            chainId: userOp.eip7702Auth.chainId,
            nonce: userOp.eip7702Auth.nonce,
          });
          const sig = Signature.from({ r: auth.r, s: auth.s, yParity: auth.yParity as 0 | 1 });
          authorizations.push({ userOpHash: userOp.userOpHash, signature: sig.serialized });
        }
      }
    }

    await uaInstance.sendTransaction(transaction, signature, authorizations);

    console.info(`EIP-7702 authorization completed for ${chainName}`);
  };

  const send = async (receiver: string, amount: string, asset: string, chain: string): Promise<any> => {
    if (mode === 'demo') {
      await new Promise(r => setTimeout(r, 1500));
      const tx: Transaction = {
        id: Math.random().toString(36).substring(7),
        type: 'sent',
        amount: parseFloat(amount),
        asset,
        chain,
        toName: receiver.startsWith('0x') ? `${receiver.slice(0, 6)}...${receiver.slice(-4)}` : receiver,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'completed',
      };
      appendTransaction(tx);

      const savedDemo = localStorage.getItem('onepay_demo_assets');
      let currentDemoAssets = DEMO_ASSETS;
      if (savedDemo) {
        try {
          currentDemoAssets = JSON.parse(savedDemo);
        } catch { }
      }
      const updatedAssets = currentDemoAssets.map(a => {
        if (a.symbol === asset && resolveChainConfig(a.chainName).label === chain) {
          const newAmt = Math.max(0, parseFloat(a.amount) - parseFloat(amount));
          return {
            ...a,
            amount: newAmt.toString(),
            amountInUSD: (newAmt * (FALLBACK_USD_PRICES[asset as SupportedAsset] || 1)).toString()
          };
        }
        return a;
      });
      localStorage.setItem('onepay_demo_assets', JSON.stringify(updatedAssets));
      setPrimaryAssets(updatedAssets);
      setBalance(sumUsd(updatedAssets));
      return { transactionId: tx.id };
    }

    if (!uaInstance || !ownerAddress) {
      throw new Error('Wallet not connected.');
    }

    try {
      const destinationChain = resolveChainConfig(chain);
      const tokenAddress = resolveTokenAddress(destinationChain.value, asset);

      console.log("[ParticleProvider] Creating transfer transaction:", {
        chainId: destinationChain.chainId,
        tokenAddress,
        amount,
        receiver,
      });

      console.log("amount", amount);

      const transaction = await uaInstance.createTransferTransaction({
        token: {
          chainId: destinationChain.chainId,
          address: tokenAddress,
        },
        amount,
        receiver,
      });


      console.log("transaction ", transaction);

      const signature = await signHash(transaction.rootHash);
      console.log("signature", signature);
      const recovered = verifyMessage(getBytes(transaction.rootHash), signature);
      console.log("Recovered signer:", recovered);
      console.log("Expected owner:", ownerAddress);

      const authorizations: any[] = [];
      if (transaction.userOps?.length) {
        for (const userOp of transaction.userOps) {
          if (userOp.eip7702Auth && !userOp.eip7702Delegated) {
            const auth = await signAuthorization({
              contractAddress: userOp.eip7702Auth.address,
              chainId: userOp.eip7702Auth.chainId,
              nonce: userOp.eip7702Auth.nonce,
            });
            const sig = Signature.from({ r: auth.r, s: auth.s, yParity: auth.yParity as 0 | 1 });
            authorizations.push({ userOpHash: userOp.userOpHash, signature: sig.serialized });
          }
        }
      }

      const result = await uaInstance.sendTransaction(transaction, signature, authorizations);
      console.log("[ParticleProvider] sendTransaction Result:", result);

      const tx: Transaction = {
        id: result.transactionId,
        type: 'sent',
        amount: parseFloat(amount),
        asset,
        chain,
        toName: receiver.startsWith('0x') ? `${receiver.slice(0, 6)}...${receiver.slice(-4)}` : receiver,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'completed',
      };
      appendTransaction(tx);
      const route = estimateRoutePreview(primaryAssets, (parseFloat(amount) || 0) * (FALLBACK_USD_PRICES[asset as SupportedAsset] || 1), asset, chain);
      await recordSendByWallet({
        senderAddress: ownerAddress,
        recipientAddress: receiver,
        token: asset,
        amount: amount,
        sourceChain: route.sourceChain,
        destinationChain: chain,
        transactionHash: result.transactionId,
      });

      setTimeout(() => refreshAssets(ownerAddress), 2000);

      return result;
    } catch (error: any) {
      console.error("[ParticleProvider] send error:", error);
      throw error;
    }
  };

  return (
    <ParticleContext.Provider
      value={{
        isConnected,
        address,
        ownerAddress,
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
        delegateChain,
        send,
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
