// Firebase Cloud Messaging Service Worker
// This file MUST live at /public/firebase-messaging-sw.js so it is served from the root scope.

// Use the same versions as in your package.json for consistency
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// IMPORTANT: Ensure these values match your Firebase project in the Console.
// Project Settings > Your apps (Web App)
firebase.initializeApp({
    apiKey: "AIzaSyBOSvZvkKkc6bbxX68Bgq8tV4k069eoG3g",
    authDomain: "rentnride-5ccaf.firebaseapp.com",
    projectId: "rentnride-5ccaf",
    storageBucket: "rentnride-5ccaf.firebasestorage.app",
    messagingSenderId: "897335055494",
    appId: "1:897335055494:web:7188cc6f05e24c3f09ad07",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[FCM SW] Background message received:", payload);

    const notificationTitle = payload.notification?.title ?? "RentNride Notification";
    const notificationOptions = {
        body: payload.notification?.body ?? "",
        icon: "/vite.svg", // Ensure this exists in /public
        badge: "/vite.svg",
        data: payload.data ?? {},
        tag: "fcm-notification-group", // Groups multiple notifications
        renotify: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] Notification clicked:', event.notification);
    event.notification.close();

    const urlToOpen = event.notification.data?.link || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
