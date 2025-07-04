
import { NextResponse } from 'next/server';

export async function GET() {
    const swScript = `
        importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
        importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
        
        const firebaseConfig = {
          apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
          authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
          projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
          storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
          messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
          appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
        };
        
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // Handler for messages when the app is in the background.
        messaging.onBackgroundMessage((payload) => {
            console.log(
                '[firebase-messaging-sw.js] Received background message ',
                payload
            );
            
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/icons/icon-192x192.png'
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
    `;
    return new NextResponse(swScript, {
        headers: {
            'Content-Type': 'application/javascript',
            'Service-Worker-Allowed': '/',
        }
    });
}
