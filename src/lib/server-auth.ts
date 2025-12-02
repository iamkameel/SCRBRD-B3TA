'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';

// This function is NOT cached. It must run on every request to get the current user.
export async function getUserId(): Promise<string | null> {
    const headersList = headers();
    const authorization = headersList.get('Authorization');
    
    if (!authorization?.startsWith('Bearer ')) {
        console.log("No authorization token found");
        return null;
    }

    try {
        const token = authorization.split('Bearer ')[1];
        if (!token) {
          console.log("Token is empty after split");
          return null;
        }
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token in getUserId:", error);
        return null;
    }
};
