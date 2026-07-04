'use server';

import { updateUserWalletAddresses, updateUserUsername } from '@/server/db';

export async function updateWalletAddresses(
  userId: number,
  walletAddress?: string,
  evmUniversalAddress?: string,
  solanaUniversalAddress?: string
) {
  try {
    await updateUserWalletAddresses(userId, walletAddress, evmUniversalAddress, solanaUniversalAddress);
    return { success: true };
  } catch (error) {
    console.error('[Wallet] Failed to update addresses:', error);
    return { success: false, error: 'Failed to update wallet addresses' };
  }
}

export async function updateUsername(userId: number, username: string) {
  try {
    await updateUserUsername(userId, username);
    return { success: true };
  } catch (error) {
    console.error('[Wallet] Failed to update username:', error);
    return { success: false, error: 'Failed to update username' };
  }
}
