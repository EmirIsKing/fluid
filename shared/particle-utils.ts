import { getBytes, hexlify, isAddress } from 'ethers';
import {
  FALLBACK_USD_PRICES,
  STABLE_ASSETS,
  type SupportedAsset,
  usdToTokenAmount,
} from '@shared/chains';

export type PrimaryAsset = {
  chainId: number;
  chainName: string;
  symbol: string;
  tokenAddress: string;
  amount: string;
  amountInUSD: string;
};

export type RoutePreview = {
  sourceAsset: string;
  sourceChain: string;
  destinationAsset: string;
  destinationChain: string;
  tokenAmount: string;
  usdAmount: number;
};

export function normalizePrimaryAssets(rawAssets: unknown[]): PrimaryAsset[] {
  return rawAssets
    .map((raw: any) => {
      const amount = String(raw?.amount ?? raw?.tokenAmount ?? '0');
      const amountInUSD = String(raw?.amountInUSD ?? raw?.amountInUsd ?? '0');
      const symbol = String(raw?.symbol ?? raw?.tokenSymbol ?? raw?.type ?? 'UNKNOWN').toUpperCase();
      const chainName = String(raw?.chainName ?? raw?.network ?? raw?.chain ?? 'Unknown');
      const chainId = Number(raw?.chainId ?? 0);
      const tokenAddress = String(raw?.tokenAddress ?? raw?.address ?? '');
      if (!symbol || parseFloat(amountInUSD) <= 0) return null;
      return {
        chainId,
        chainName,
        symbol,
        tokenAddress,
        amount,
        amountInUSD,
      } satisfies PrimaryAsset;
    })
    .filter(Boolean) as PrimaryAsset[];
}

export function getAssetUsdPrice(asset: PrimaryAsset): number {
  const amount = parseFloat(asset.amount);
  const usd = parseFloat(asset.amountInUSD);
  if (amount > 0 && usd > 0) return usd / amount;
  return FALLBACK_USD_PRICES[asset.symbol as SupportedAsset] ?? 1;
}

export function estimateRoutePreview(
  primaryAssets: PrimaryAsset[],
  usdAmount: number,
  destinationAsset: string,
  destinationChain: string,
): RoutePreview {
  const destSymbol = destinationAsset.toUpperCase();
  const destPrice = primaryAssets.find(a => a.symbol === destSymbol)
    ? getAssetUsdPrice(primaryAssets.find(a => a.symbol === destSymbol)!)
    : FALLBACK_USD_PRICES[destSymbol as SupportedAsset] ?? 1;

  const tokenAmount = usdToTokenAmount(usdAmount, destSymbol, destPrice);

  const sortedSources = [...primaryAssets].sort(
    (a, b) => parseFloat(b.amountInUSD) - parseFloat(a.amountInUSD),
  );
  const preferred = sortedSources.find(a => STABLE_ASSETS.has(a.symbol as SupportedAsset))
    ?? sortedSources[0];

  return {
    sourceAsset: preferred?.symbol ?? 'Primary asset',
    sourceChain: preferred?.chainName ?? 'Auto-selected',
    destinationAsset: destSymbol,
    destinationChain,
    tokenAmount,
    usdAmount,
  };
}

export async function signRootHash(
  rootHash: string,
  ownerAddress: string,
): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('MetaMask is not connected or installed');

  const message = hexlify(getBytes(rootHash));
  return ethereum.request({
    method: 'personal_sign',
    params: [message, ownerAddress],
  }) as Promise<string>;
}

export async function collectEip7702Authorizations(
  transaction: { userOps?: Array<{ eip7702Auth?: unknown; eip7702Delegated?: boolean; userOpHash?: string }> },
  ownerAddress: string,
): Promise<Array<{ userOpHash: string; signature: string }>> {
  const authorizations: Array<{ userOpHash: string; signature: string }> = [];
  const nonceMap = new Map<number, string>();
  const ethereum = (window as any).ethereum;
  if (!ethereum || !transaction.userOps?.length) return authorizations;

  for (const userOp of transaction.userOps) {
    if (!userOp.eip7702Auth || userOp.eip7702Delegated || !userOp.userOpHash) continue;

    const auth = userOp.eip7702Auth as { nonce: number; chainId?: number; address?: string; r?: string; s?: string; yParity?: number };
    let signature = nonceMap.get(auth.nonce);

    if (!signature) {
      try {
        signature = (await ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [ownerAddress, buildEip7702TypedData(auth, ownerAddress)],
        })) as string;
      } catch {
        signature = (await ethereum.request({
          method: 'personal_sign',
          params: [hexlify(getBytes(userOp.userOpHash)), ownerAddress],
        })) as string;
      }
      nonceMap.set(auth.nonce, signature);
    }

    authorizations.push({ userOpHash: userOp.userOpHash, signature });
  }

  return authorizations;
}

function buildEip7702TypedData(auth: { nonce: number; chainId?: number; address?: string }, ownerAddress: string) {
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      Authorization: [
        { name: 'chainId', type: 'uint256' },
        { name: 'address', type: 'address' },
        { name: 'nonce', type: 'uint256' },
      ],
    },
    primaryType: 'Authorization',
    domain: {
      name: 'Authorization',
      version: '1',
      chainId: auth.chainId ?? 1,
    },
    message: {
      chainId: auth.chainId ?? 1,
      address: auth.address ?? ownerAddress,
      nonce: auth.nonce,
    },
  });
}

export function validateRecipientAddress(input: string, resolvedAddress?: string): string {
  const candidate = (resolvedAddress ?? input).trim();
  if (!isAddress(candidate)) {
    throw new Error('Enter a valid 0x address or @username.');
  }
  return candidate;
}
