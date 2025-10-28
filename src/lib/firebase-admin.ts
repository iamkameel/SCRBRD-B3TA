import { initializeApp, getApps, getApp, type App, credential } from 'firebase-admin/app';

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to your .env file.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey);
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  throw new Error("The FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON string.");
}

const adminApp: App = !getApps().length
  ? initializeApp({
      credential: credential.cert(serviceAccount),
    })
  : getApp();

export { adminApp };
