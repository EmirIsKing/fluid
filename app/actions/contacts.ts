'use server';

import { getUserContacts, upsertContact as dbUpsertContact } from '@/server/db';

export async function getContacts(userId: number) {
  try {
    const contacts = await getUserContacts(userId);
    return { success: true, data: contacts };
  } catch (error) {
    console.error('[Contacts] Failed to get contacts:', error);
    return { success: false, data: [], error: 'Failed to fetch contacts' };
  }
}

export async function upsertContact(userId: number, address: string, name?: string) {
  try {
    await dbUpsertContact(userId, address, name);
    return { success: true };
  } catch (error) {
    console.error('[Contacts] Failed to upsert contact:', error);
    return { success: false, error: 'Failed to save contact' };
  }
}
