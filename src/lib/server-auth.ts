
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';

// This function is NOT cached. It must run on every request to get the current user.
export async function getUserId(): Promise<string | null> {
    const headersList = headers();
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
        
        return decodedToken.uid;
    } catch (error) {
        return null;
    }
};
