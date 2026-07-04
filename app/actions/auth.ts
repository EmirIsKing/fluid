'use server';

import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@shared/const';
import { getUserByOpenId } from '@/server/db';

export async function getMe() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const user = await getUserByOpenId(sessionCookie.value);
    return user ?? null;
  } catch (error) {
    console.error('[Auth] Failed to get user:', error);
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}
