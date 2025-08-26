'use client';

import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';

export const getFcmToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY === 'YOUR_VAPID_KEY_HERE') {
        console.error("VAPID key is missing. Push notifications will not work. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY in your .env file.");
        return null;
    }

    const supported = await isSupported();
    if (!supported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }

    try {
        const messaging = getMessaging(app);
        
        // Register the service worker
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw');

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const fcmToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: swRegistration,
            });
            if (fcmToken) {
                return fcmToken;
            }
            console.warn('No registration token available. Request permission to generate one.');
            return null;
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token or setting up service worker. ', error);
        return null;
    }
};
