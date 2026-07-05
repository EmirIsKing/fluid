import { describe, expect, it } from 'vitest';
import {
  assetsForChain,
  isValidEvmAddress,
  isValidRecipient,
  resolveChainConfig,
  resolveTokenAddress,
  usdToTokenAmount,
} from './chains';

describe('resolveChainConfig', () => {
  it('maps aliases to supported chains', () => {
    expect(resolveChainConfig('arbitrum').value).toBe('Arbitrum One');
    expect(resolveChainConfig('bsc').value).toBe('BNB Chain');
    expect(resolveChainConfig('xlayer').value).toBe('X Layer');
  });
});

describe('resolveTokenAddress', () => {
  it('returns USDC on Base', () => {
    expect(resolveTokenAddress('Base', 'USDC')).toMatch(/^0x/i);
  });

  it('throws for unsupported asset on chain', () => {
    expect(() => resolveTokenAddress('X Layer', 'USDT')).toThrow();
  });
});

describe('assetsForChain', () => {
  it('lists BNB only on BNB Chain', () => {
    expect(assetsForChain('BNB Chain')).toContain('BNB');
    expect(assetsForChain('Base')).not.toContain('BNB');
  });
});

describe('usdToTokenAmount', () => {
  it('converts USD to stablecoin amount 1:1', () => {
    expect(usdToTokenAmount(50, 'USDC')).toBe('50');
  });

  it('converts USD to ETH using fallback price', () => {
    expect(usdToTokenAmount(3350, 'ETH')).toBe('1');
  });
});

describe('recipient validation', () => {
  it('accepts valid EVM addresses', () => {
    expect(isValidEvmAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
  });

  it('accepts @username recipients', () => {
    expect(isValidRecipient('@bob')).toBe(true);
    expect(isValidRecipient('0xnotanaddress')).toBe(false);
  });
});
