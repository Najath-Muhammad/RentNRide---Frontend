import { env } from "../config/env";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let messaging: Messaging;

export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        app = initializeApp(firebaseConfig);
    }
    return app;
}

export function getFirebaseMessaging(): Messaging {
    if (!messaging) {
        messaging = getMessaging(getFirebaseApp());
    }
    return messaging;
}
