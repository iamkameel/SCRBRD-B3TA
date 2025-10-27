
'use server';

import { getAuth } from 'firebase/auth';
import { app } from './firebase';
import { cache } from 'react';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

/**
 * Gets the current user's ID on the **server**.
 * This is the definitive, secure way to get the current user's UID on the server.
 * It inspects the session cookie provided by Firebase Hosting.
 * This function should ONLY be used in Server Components and Server Actions.
 */
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const sessionCookie = headers().get('__session')?.value;
    if (!sessionCookie) {
      // No session cookie found, user is not logged in.
      return null;
    }
    const auth = getAdminAuth(adminApp);
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken.uid;
  } catch (error) {
    // Could not verify session cookie. User is likely not logged in or cookie is invalid.
    return null;
  }
});


/**
 * Gets the current user's ID on the **client**.
 * This function uses the client-side auth state and should ONLY be used in client components.
 * It does not guarantee the user is authenticated on the server.
 * @returns The user's UID, or null if not logged in.
 */
export function getClientUserId(): string | null {
  const auth = getAuth(app);
  return auth.currentUser?.uid || null;
}
