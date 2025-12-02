
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';
import { GOD_TIER_EMAIL, GOD_TIER_UID } from './data';

// This function is NOT cached. It must run on every request to get the current user.
export async function getUserId(): Promise<string | null> {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization) {
        return null;
    }

    try {
        const token = authorization.split('Bearer ')[1];
        if (!token) {
          return null;
        }
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        
        // If the token belongs to the special admin, return the consistent hardcoded UID.
        if (decodedToken.email === GOD_TIER_EMAIL) {
            return GOD_TIER_UID;
        }

        return decodedToken.uid;
    } catch (error) {
        return null;
    }
};
