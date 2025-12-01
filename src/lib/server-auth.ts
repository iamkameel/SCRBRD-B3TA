
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';

// This function is NOT cached. It must run on every request to get the current user.
export const getUserId = async (): Promise<string | null> => {
    const authHeader = (await headers()).get('Authorization');
    if (!authHeader) {
        console.warn("Authorization header missing. User cannot be authenticated on the server.");
        return null;
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying auth token in getUserId:", error);
        return null;
    }
};
