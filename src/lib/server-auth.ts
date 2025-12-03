
'use server';

import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

// This is the correct, secure way to get the user's ID on the server.
// It verifies the session cookie from the headers.
export async function getUserId(): Promise<string | null> {
  const session = headers().get('Authorization')?.split('Bearer ')[1];
  if (!session) {
    // This will be the case for unauthenticated users.
    return null;
  }
  
  try {
    const decodedIdToken = await getAuth(adminApp).verifySessionCookie(session, true);
    return decodedIdToken.uid;
  } catch (error) {
    console.warn("Failed to verify session cookie:", error);
    // This can happen if the cookie is expired or invalid.
    return null;
  }
};
