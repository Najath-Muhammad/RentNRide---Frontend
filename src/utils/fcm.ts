import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { api } from './axios';

// Must match firebase-messaging-sw.js exactly
const firebaseConfig = {
    apiKey: "AIzaSyBOSvZvkKkc6bbxX68Bgq8tV4k069eoG3g",
    authDomain: "rentnride-5ccaf.firebaseapp.com",
    projectId: "rentnride-5ccaf",
    storageBucket: "rentnride-5ccaf.firebasestorage.app",
    messagingSenderId: "897335055494",
    appId: "1:897335055494:web:7188cc6f05e24c3f09ad07",
};

// VAPID key — from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = "BPkLnTSMuVwIaqAo3Bpc_nLJaxJHCfKM1hVfRGqLNuv_dT7hnz13NeNIR7x3r3klXkJuXKPVQV3S0vPL3lHxnZE";

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getFirebaseMessaging() {
    if (messagingInstance) return messagingInstance;
    // Avoid re-initializing on hot reload
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    messagingInstance = getMessaging(app);
    return messagingInstance;
}

/**
 * Request notification permission, get FCM token, register it with the backend.
 * Safe to call multiple times — no-ops if already granted & token already registered.
 */
export async function registerFcmToken(): Promise<void> {
    try {
        if (!('Notification' in window)) {
            console.warn('[FCM] Notifications not supported in this browser');
            return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[FCM] Notification permission denied');
            return;
        }

        // Register service worker if needed
        if (!('serviceWorker' in navigator)) {
            console.warn('[FCM] Service workers not supported');
            return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const messaging = getFirebaseMessaging();
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn('[FCM] No registration token available');
            return;
        }

        // Send token to backend
        await api.post('/fcm/token', { token });
        console.log('[FCM] Token registered with backend:', token.slice(0, 20) + '...');

        // Listen for foreground messages and dispatch a custom event
        // (Navbar listens for "fcm:message" to refresh notifications)
        onMessage(messaging, (payload) => {
            console.log('[FCM] Foreground message received:', payload);
            window.dispatchEvent(new CustomEvent('fcm:message', { detail: payload }));

            // Show a browser notification even when the tab is in focus
            if (payload.notification) {
                new Notification(payload.notification.title ?? 'RentNRide', {
                    body: payload.notification.body ?? '',
                    icon: '/vite.svg',
                });
            }
        });
    } catch (err) {
        // Never crash the app over notifications
        console.error('[FCM] registerFcmToken error:', err);
    }
}
