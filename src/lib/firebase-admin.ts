
import * as admin from 'firebase-admin';

// This file is intended for server-side Firebase Admin SDK initialization only.
// Do not export anything other than the `adminApp` instance.

const appName = 'firebase-admin-app-scrbd';

function getAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        const existingApp = admin.apps.find(app => app?.name === appName);
        if (existingApp) {
            return existingApp;
        }
    }

    let credential;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        try {
            const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
            credential = admin.credential.cert(serviceAccount);
        } catch (error) {
            console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
            // Fallback to application default if parsing fails
            credential = admin.credential.applicationDefault();
        }
    } else {
        credential = admin.credential.applicationDefault();
    }
    
    const options: admin.AppOptions = {
        credential,
    };
    return admin.initializeApp(options, appName);
}

export const adminApp = getAdminApp();
