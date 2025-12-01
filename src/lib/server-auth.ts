
'use server';

import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { adminApp } from './firebase-admin';

// This function is NOT cached. It must run on every request to get the current user.
export const getUserId = async (): Promise<string | null> => {
    // Correctly await the headers object before accessing its properties.
    const authorization = headers().get('Authorization');
    
    if (!authorization) {
        // This is a common case for public pages, so we don't log an error.
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
        // This can happen if the token is expired or invalid. It's not necessarily an "error"
        // in the traditional sense, just an unauthenticated user.
        return null;
    }
};
