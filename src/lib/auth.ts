
'use client';

import { getAuth } from 'firebase/auth';
import { app } from './firebase';


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
