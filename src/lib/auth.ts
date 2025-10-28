
'use client';

import { getAuth } from "firebase/auth";
import { app } from './firebase';

/**
 * Gets the current user's ID on the **client**.
 * This is a convenience function for use in client components.
 * It does not guarantee the user is authenticated on the server.
 * @returns The user's UID, or null if not logged in.
 */
export function getClientUserId(): string | null {
  // This function is intended for client-side use, but because this is a 'use server' file,
  // it can't be imported to the client. This is a placeholder and should not be used
  // in client components. Client-side user state should be managed via the AuthContext.
  const auth = getAuth(app);
  return auth.currentUser?.uid || null;
}
