// Firebase Cloud Messaging Service Worker
// This file MUST live at /public/firebase-messaging-sw.js so it is served from the root scope.
// Replace the placeholder values below with your actual Firebase project config.
// These are public-safe — security comes from server-side Admin SDK.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// IMPORTANT: Paste your Firebase project's config object here.
// These values are the same ones you get from "Project Settings > Your apps" in Firebase Console.
firebase.initializeApp({
    apiKey: "AIzaSyBOSvZvkKkc6bbxX68Bgq8tV4k069eoG3g",
    authDomain: "rentnride-5ccaf.firebaseapp.com",
    projectId: "rentnride-5ccaf",
    storageBucket: "rentnride-5ccaf.firebasestorage.app",
    messagingSenderId: "897335055494",
    appId: "1:897335055494:web:7188cc6f05e24c3f09ad07",
});

const messaging = firebase.messaging();

// Handle background messages (app in background / closed tab)
messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background message received:", payload);

    const notificationTitle = payload.notification?.title ?? "Notification";
    const notificationOptions = {
        body: payload.notification?.body ?? "",
        icon: "/vite.svg",
        badge: "/vite.svg",
        data: payload.data ?? {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
