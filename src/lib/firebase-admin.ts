
import admin from 'firebase-admin';

// This file is intended for server-side Firebase Admin SDK initialization only.
// Do not export anything other than the `adminApp` instance.
// Functions that need to use this should be in their own 'use server' files.

const appName = 'firebase-admin-app-scrbd';

function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        const existingApp = admin.apps.find(app => app?.name === appName);
        if (existingApp) {
            return existingApp;
        }
    }
    const options: admin.AppOptions = {
        credential: admin.credential.applicationDefault(),
    };
    return admin.initializeApp(options, appName);
}

export const adminApp = getAdminApp();
