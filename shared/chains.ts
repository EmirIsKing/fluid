/** Supported destination chains for Particle Universal Account transfers (mainnet). */
export const SUPPORTED_CHAINS = [
  {
    label: 'Base',
    value: 'Base',
    chainId: 8453,
    explorer: 'https://basescan.org/tx',
    dotColor: 'bg-indigo-600',
  },
  {
    label: 'Ethereum',
    value: 'Ethereum',
    chainId: 1,
    explorer: 'https://etherscan.io/tx',
    dotColor: 'bg-blue-500',
  },
  {
    label: 'Arbitrum One',
    value: 'Arbitrum One',
    chainId: 42161,
    explorer: 'https://arbiscan.io/tx',
    dotColor: 'bg-sky-500',
  },
  {
    label: 'BNB Chain',
    value: 'BNB Chain',
    chainId: 56,
    explorer: 'https://bscscan.com/tx',
    dotColor: 'bg-yellow-500',
  },
  {
    label: 'X Layer',
    value: 'X Layer',
    chainId: 196,
    explorer: 'https://www.oklink.com/xlayer/tx',
    dotColor: 'bg-purple-500',
  },
] as const;

export type SupportedChainValue = (typeof SUPPORTED_CHAINS)[number]['value'];

export const SUPPORTED_ASSETS = ['USDC', 'USDT', 'ETH', 'BNB'] as const;
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

export const NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

/** Per-chain token contract addresses (mainnet). */
export const TOKEN_ADDRESSES: Record<SupportedChainValue, Partial<Record<SupportedAsset, string>>> = {
  Base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ETH: NATIVE_TOKEN_ADDRESS,
  },
  Ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    ETH: NATIVE_TOKEN_ADDRESS,
  },
  'Arbitrum One': {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    ETH: NATIVE_TOKEN_ADDRESS,
  },
  'BNB Chain': {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BNB: NATIVE_TOKEN_ADDRESS,
  },
  'X Layer': {
    USDC: '0x74b71656c5b18353af52d548d75451b81915dce1',
    ETH: NATIVE_TOKEN_ADDRESS,
  },
};

/** Approximate USD prices when live asset data is unavailable. */
export const FALLBACK_USD_PRICES: Record<SupportedAsset, number> = {
  USDC: 1,
  USDT: 1,
  ETH: 3350,
  BNB: 600,
};

export const STABLE_ASSETS = new Set<SupportedAsset>(['USDC', 'USDT']);

export function resolveChainConfig(chainName: string) {
  const normalized = chainName.trim().toLowerCase();
  return (
    SUPPORTED_CHAINS.find(c => c.value.toLowerCase() === normalized) ??
    SUPPORTED_CHAINS.find(c => {
      if (normalized.includes('ether')) return c.value === 'Ethereum';
      if (normalized.includes('arbitrum')) return c.value === 'Arbitrum One';
      if (normalized.includes('bnb') || normalized.includes('bsc')) return c.value === 'BNB Chain';
      if (normalized.includes('x layer') || normalized.includes('xlayer')) return c.value === 'X Layer';
      if (normalized.includes('base')) return c.value === 'Base';
      return false;
    }) ??
    SUPPORTED_CHAINS[0]
  );
}

export function resolveTokenAddress(chainName: string, asset: string): string {
  const chain = resolveChainConfig(chainName);
  const symbol = asset.toUpperCase() as SupportedAsset;
  const onChain = TOKEN_ADDRESSES[chain.value][symbol];
  if (onChain) return onChain;

  if (symbol === 'ETH' || symbol === 'BNB') return NATIVE_TOKEN_ADDRESS;

  throw new Error(`${asset} is not supported on ${chain.label}. Choose another asset or chain.`);
}

export function isSupportedAssetOnChain(chainName: string, asset: string): boolean {
  try {
    resolveTokenAddress(chainName, asset);
    return true;
  } catch {
    return false;
  }
}

/** Assets that can be delivered on a given destination chain. */
export function assetsForChain(chainName: string): SupportedAsset[] {
  const chain = resolveChainConfig(chainName);
  return SUPPORTED_ASSETS.filter(asset => Boolean(TOKEN_ADDRESSES[chain.value][asset]));
}

export const UNIVERSALX_ACTIVITY_URL = 'https://universalx.app/activity/details?id=';

export function isValidEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

export function isValidRecipient(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('@')) return trimmed.length > 1;
  return isValidEvmAddress(trimmed);
}

export function usdToTokenAmount(
  usdAmount: number,
  asset: string,
  priceUsd?: number,
): string {
  if (usdAmount <= 0) return '0';
  const price = priceUsd && priceUsd > 0
    ? priceUsd
    : FALLBACK_USD_PRICES[asset.toUpperCase() as SupportedAsset] ?? 1;
  const tokens = usdAmount / price;
  if (tokens <= 0) throw new Error('Amount must be greater than zero.');
  return tokens.toFixed(6).replace(/\.?0+$/, '') || '0';
}

export function tokenAmountToUsd(
  tokenAmount: number,
  asset: string,
  priceUsd?: number,
): number {
  const price = priceUsd && priceUsd > 0
    ? priceUsd
    : FALLBACK_USD_PRICES[asset.toUpperCase() as SupportedAsset] ?? 1;
  return tokenAmount * price;
}

export const SUPPORTED_CHAIN_LABELS = SUPPORTED_CHAINS.map(c => c.label);
