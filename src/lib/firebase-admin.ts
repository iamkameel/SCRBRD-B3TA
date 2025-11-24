
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { cache } from 'react';

// This file is intended for server-side Firebase Admin SDK initialization only.
// Do not export anything other than the `adminApp` instance.
// Functions that need to use this should be in their own 'use server' files.

const appName = 'firebase-admin-app-scrbd';

function getAdminApp(): admin.app.App {
    const existingApp = admin.apps.find(app => app?.name === appName);
    if (existingApp) {
        return existingApp;
    }
    const options: admin.AppOptions = {
        credential: admin.credential.applicationDefault(),
    };
    return admin.initializeApp(options, appName);
}

export const adminApp = getAdminApp();

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
