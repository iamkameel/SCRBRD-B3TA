
'use server';

import { initializeApp, getApps, getApp, type App, credential } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { cache } from 'react';
import { headers } from 'next/headers';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to your .env file.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  throw new Error("The FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON string.");
}

const adminApp: App = !getApps().length
  ? initializeApp({
      credential: credential.cert(serviceAccount),
    })
  : getApp();

export const verifySessionCookie = async (sessionCookie: string) => {
    const auth = getAdminAuth(adminApp);
    try {
        const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
        return decodedIdToken;
    } catch (error) {
        return null;
    }
};

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
  const decodedIdToken = await verifySessionCookie(sessionCookie);
  if (!decodedIdToken) {
    return null;
  }
  return decodedIdToken.uid;
});


export { adminApp };
