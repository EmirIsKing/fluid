import { describe, expect, it } from 'vitest';
import { estimateRoutePreview, normalizePrimaryAssets } from './particle-utils';

describe('normalizePrimaryAssets', () => {
  it('maps SDK asset shapes to PrimaryAsset', () => {
    const assets = normalizePrimaryAssets([
      {
        symbol: 'USDC',
        chainName: 'Base',
        chainId: 8453,
        amount: '100',
        amountInUSD: '100',
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      },
    ]);

    expect(assets).toHaveLength(1);
    expect(assets[0].symbol).toBe('USDC');
    expect(assets[0].chainName).toBe('Base');
  });

  it('drops zero-value rows', () => {
    const assets = normalizePrimaryAssets([{ symbol: 'ETH', amountInUSD: '0' }]);
    expect(assets).toHaveLength(0);
  });
});

describe('estimateRoutePreview', () => {
  const primaryAssets = normalizePrimaryAssets([
    { symbol: 'USDC', chainName: 'Arbitrum One', chainId: 42161, amount: '200', amountInUSD: '200' },
    { symbol: 'ETH', chainName: 'Base', chainId: 8453, amount: '0.05', amountInUSD: '167.5' },
  ]);

  it('prefers stablecoins as source and converts USD to destination token amount', () => {
    const route = estimateRoutePreview(primaryAssets, 50, 'USDC', 'Base');
    expect(route.sourceAsset).toBe('USDC');
    expect(route.sourceChain).toBe('Arbitrum One');
    expect(route.tokenAmount).toBe('50');
    expect(route.destinationChain).toBe('Base');
  });
});
