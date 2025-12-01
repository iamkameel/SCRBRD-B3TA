
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { adminApp } from './firebase-admin';

const GOD_TIER_UID = '0o2nS9M8g4N2wL4E1bB3t6xYv5Z2'; // A consistent, hardcoded UID for the super admin

export const getUserId = cache(async (): Promise<string | null> => {
    // This is the fallback for the development environment where the auth header might not be properly set up.
    // It directly grants the god-tier UID.
    // This check is now the primary mechanism, avoiding the problematic headers() call.
    if (process.env.NODE_ENV === 'development') {
        return GOD_TIER_UID;
    }
    
    const headerObj = headers();
    const authorization = headerObj.get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.split("Bearer ")[1];
        try {
            const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            console.error("Error verifying ID token:", error);
            return null;
        }
    }

    return null;
});
