'use server';

import {
  getUserTransactions,
  getUserByWalletAddress,
  createTransaction as dbCreateTransaction,
  updateTransactionStatus as dbUpdateTransactionStatus,
} from '@/server/db';

export async function getTransactions(userId: number, limit: number = 50) {
  try {
    const transactions = await getUserTransactions(userId, limit);
    return { success: true, data: transactions };
  } catch (error) {
    console.error('[Transactions] Failed to get transactions:', error);
    return { success: false, data: [], error: 'Failed to fetch transactions' };
  }
}

export async function createTransaction(data: {
  userId: number;
  senderAddress: string;
  recipientAddress: string;
  token: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
  status?: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  note?: string;
}) {
  try {
    await dbCreateTransaction(data);
    return { success: true };
  } catch (error) {
    console.error('[Transactions] Failed to create transaction:', error);
    return { success: false, error: 'Failed to create transaction' };
  }
}

export async function updateTransactionStatus(
  transactionHash: string,
  status: 'pending' | 'confirmed' | 'failed'
) {
  try {
    await dbUpdateTransactionStatus(transactionHash, status);
    return { success: true };
  } catch (error) {
    console.error('[Transactions] Failed to update transaction:', error);
    return { success: false, error: 'Failed to update transaction status' };
  }
}

/** Persist a send when the wallet address matches a stored user (best-effort). */
export async function recordSendByWallet(data: {
  senderAddress: string;
  recipientAddress: string;
  token: string;
  amount: string;
  sourceChain: string;
  destinationChain: string;
  transactionHash: string;
  note?: string;
}) {
  try {
    const user = await getUserByWalletAddress(data.senderAddress);
    if (!user) return { success: false, skipped: true };

    await dbCreateTransaction({
      userId: user.id,
      senderAddress: data.senderAddress,
      recipientAddress: data.recipientAddress,
      token: data.token,
      amount: data.amount,
      sourceChain: data.sourceChain,
      destinationChain: data.destinationChain,
      status: 'confirmed',
      transactionHash: data.transactionHash,
      note: data.note,
    });
    return { success: true };
  } catch (error) {
    console.error('[Transactions] Failed to record wallet send:', error);
    return { success: false, error: 'Failed to record transaction' };
  }
}
