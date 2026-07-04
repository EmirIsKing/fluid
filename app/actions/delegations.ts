'use server';

import {
  getUserDelegations,
  getDelegationStatus as dbGetDelegationStatus,
  upsertDelegation as dbUpsertDelegation,
} from '@/server/db';

export async function getDelegations(userId: number) {
  try {
    const delegations = await getUserDelegations(userId);
    return { success: true, data: delegations };
  } catch (error) {
    console.error('[Delegations] Failed to get delegations:', error);
    return { success: false, data: [], error: 'Failed to fetch delegations' };
  }
}

export async function getDelegationStatus(userId: number, chainId: number) {
  try {
    const status = await dbGetDelegationStatus(userId, chainId);
    return { success: true, data: status };
  } catch (error) {
    console.error('[Delegations] Failed to get delegation status:', error);
    return { success: false, data: null, error: 'Failed to fetch delegation status' };
  }
}

export async function upsertDelegation(
  userId: number,
  chainId: number,
  chainName: string,
  isDelegated: boolean,
  delegatedAddress?: string
) {
  try {
    await dbUpsertDelegation(userId, chainId, chainName, isDelegated, delegatedAddress);
    return { success: true };
  } catch (error) {
    console.error('[Delegations] Failed to upsert delegation:', error);
    return { success: false, error: 'Failed to update delegation' };
  }
}
