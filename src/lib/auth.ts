'use server';

import { cache } from 'react';
import { headers } from 'next/headers';
import { getAuth } from 'firebase/auth';
import { app } from './firebase';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { adminApp } from './firebase-admin';

/**
 * Gets the current user's ID on the client.
 * NOTE: This is not a secure way to check for authentication,
 * as it relies on the client's state. Always verify on the server.
 * It's useful for UI purposes, like showing a user's own data.
 * It does not guarantee the user is authenticated on the server.
 * @returns The user's UID, or null if not logged in.
 */
export function getClientUserId(): string | null {
  const auth = getAuth(app);
  return auth.currentUser?.uid || null;
}

/**
 * Gets the current user's ID on the **server**.
 * This is the definitive, secure way to get the current user's UID on the server.
 * It inspects the session cookie provided by Firebase Hosting.
 * This function should ONLY be used in Server Components and Server Actions.
 */
export const getUserId = cache(async (): Promise<string | null> => {
  const sessionCookie = headers().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }
  const auth = getAdminAuth(adminApp);
  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken.uid;
  } catch (error) {
    return null;
  }
});
