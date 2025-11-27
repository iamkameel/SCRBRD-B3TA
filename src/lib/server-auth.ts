'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { cache } from 'react';
import { adminApp } from './firebase-admin';

export const getUserId = cache(async (): Promise<string | null> => {
    const authorization = headers().get("Authorization");
    if (authorization?.startsWith("Bearer ")) {
        const idToken = authorization.split("Bearer ")[1];
        try {
            const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
            return decodedToken.uid;
        } catch (error) {
            // This can happen if the token is expired or invalid.
            // It's a normal part of the auth flow, so we don't need to log an error.
            return null;
        }
    }
    // No authorization header found.
    return null;
});
