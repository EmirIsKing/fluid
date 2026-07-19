import { getBytes, hexlify, isAddress, Signature } from 'ethers';
import {
  FALLBACK_USD_PRICES,
  STABLE_ASSETS,
  SUPPORTED_CHAINS,
  type SupportedAsset,
  usdToTokenAmount,
} from '@shared/chains';
import { useWallets } from '@particle-network/connectkit';


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
  console.log('[normalizePrimaryAssets] Input rawAssets:', JSON.stringify(rawAssets, null, 2));

  if (!Array.isArray(rawAssets)) {
    console.warn('[normalizePrimaryAssets] rawAssets is not an array!');
    return [];
  }

  const normalized: PrimaryAsset[] = [];

  for (const rawAsset of rawAssets) {
    if (!rawAsset || typeof rawAsset !== 'object') continue;
    const asset = rawAsset as Record<string, any>;

    // Check if it has chainAggregation (modern SDK structure)
    if (Array.isArray(asset.chainAggregation)) {
      for (const item of asset.chainAggregation) {
        if (!item || !item.token) continue;

        const amount = String(item.amount ?? '0');
        const amountInUSD = String(item.amountInUSD ?? '0');
        const symbol = String(item.token.symbol ?? item.token.type ?? asset.tokenType ?? 'UNKNOWN').toUpperCase();
        const chainId = Number(item.token.chainId ?? 0);

        const chainConfig = SUPPORTED_CHAINS.find(c => c.chainId === chainId);
        const chainName = chainConfig ? chainConfig.value : 'Unknown';
        const tokenAddress = String(item.token.address ?? '');

        // Use token amount instead of just USD value to ensure we don't drop tokens with no USD price
        if (parseFloat(amount) > 0 || parseFloat(amountInUSD) > 0) {
          normalized.push({
            chainId,
            chainName,
            symbol,
            tokenAddress,
            amount,
            amountInUSD,
          });
        }
      }
    } else {
      // Fallback for legacy format or already-normalized items (if any)
      const amount = String(asset.amount ?? asset.tokenAmount ?? '0');
      const amountInUSD = String(asset.amountInUSD ?? asset.amountInUsd ?? '0');
      const symbol = String(asset.symbol ?? asset.tokenSymbol ?? asset.type ?? 'UNKNOWN').toUpperCase();
      const chainName = String(asset.chainName ?? asset.network ?? asset.chain ?? 'Unknown');
      const chainId = Number(asset.chainId ?? 0);
      const tokenAddress = String(asset.tokenAddress ?? asset.address ?? '');

      if (symbol && (parseFloat(amount) > 0 || parseFloat(amountInUSD) > 0)) {
        normalized.push({
          chainId,
          chainName,
          symbol,
          tokenAddress,
          amount,
          amountInUSD,
        });
      }
    }
  }

  console.log('[normalizePrimaryAssets] Output normalized:', JSON.stringify(normalized, null, 2));
  return normalized;
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


import { hexToBytes, type Hex } from 'viem';

export function useSignRootHash() {
  const [primaryWallet] = useWallets();

  // Accept a verified Hex string (0x...) or a raw message string
  return async (messageHex: string): Promise<string> => {
    if (!primaryWallet) {
      throw new Error('No wallet instance found');
    }

    const walletClient = primaryWallet.getWalletClient();
    const accountAddress = primaryWallet.accounts[0];

    if (!walletClient || !accountAddress) {
      throw new Error('No wallet connected');
    }

    // 1. Convert the hex string hash into a raw byte array (equivalent to ethers' getBytes)
    const rawBytes = hexToBytes(messageHex as Hex);

    // 2. Pass the byte array explicitly into the message field
    const signature = await walletClient.signMessage({
      account: accountAddress as `0x${string}`,
      message: { raw: rawBytes }, // Viem natively accepts Uint8Array raw bytes here
    });

    return signature;
  };
}


export async function signRootHash(
  rootHash: string,
  ownerAddress: string,
): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('MetaMask is not connected or installed');

  const message = hexlify(getBytes(rootHash));
  const rawSignature = await ethereum.request({
    method: 'personal_sign',
    params: [message, ownerAddress.toLowerCase()],
  }) as string;

  return Signature.from(rawSignature).serialized;
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
      console.log('[collectEip7702Authorizations] Requesting EIP-7702 auth for:', auth);

      const typedData = buildEip7702TypedData(auth, ownerAddress.toLowerCase());
      console.log('[collectEip7702Authorizations] Typed Data:', typedData);

      let rawSignature;
      try {
        rawSignature = (await ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [ownerAddress.toLowerCase(), typedData],
        })) as string;
      } catch (err: any) {
        console.error('[collectEip7702Authorizations] eth_signTypedData_v4 failed:', err);
        throw new Error(`Failed to sign EIP-7702 authorization: ${err?.message || 'Unknown error'}`);
      }

      signature = Signature.from(rawSignature).serialized;
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

