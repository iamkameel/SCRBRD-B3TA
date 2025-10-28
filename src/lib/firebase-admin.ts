
import { initializeApp, getApps, getApp, credential, type App } from 'firebase-admin/app';

// This file is intended for server-side Firebase Admin SDK initialization only.
// Do not export anything other than the `adminApp` instance.
// Functions that need to use this should be in their own 'use server' files.

export const adminApp: App = !getApps().length
  ? initializeApp({
      // Application Default Credentials are used in the App Hosting environment.
      credential: credential.applicationDefault(),
    })
  : getApp();
