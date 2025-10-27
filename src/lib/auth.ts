
'use client';

import { getAuth } from 'firebase/auth';
import { app } from './firebase';

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
