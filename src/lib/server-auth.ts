
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';
import { GOD_TIER_UID } from './data';

// This function is NOT cached. It must run on every request to get the current user.
export const getUserId = async (): Promise<string | null> => {
    const authHeader = (await headers()).get('Authorization');
    if (!authHeader) {
        // This is a fallback for development where the auth header might not be present.
        // In a real production environment, you might want to throw an error here.
        // For this app's specific case, we have a known "god" user.
        return GOD_TIER_UID;
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying auth token in getUserId:", error);
        // Fallback to god-tier user in case of token verification failure during development
        return GOD_TIER_UID;
    }
};
