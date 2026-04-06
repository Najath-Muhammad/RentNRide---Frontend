import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "../config/firebase.config";
import { api } from "../utils/axios";

const FCM_TOKEN_KEY = "fcm_token";
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

async function syncTokenWithBackend(token: string): Promise<void> {
    await api.post("/fcm/token", { token });
}

export async function removeFcmToken(): Promise<void> {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (!token) return;
    try {
        await api.delete("/fcm/token", { data: { token } });
        localStorage.removeItem(FCM_TOKEN_KEY);
    } catch {
        
    }
}


export async function initPushNotifications(): Promise<void> {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        console.warn("[FCM] Push notifications are not supported in this browser.");
        return;
    }

    const isPlaceholder =
        !VAPID_KEY ||
        VAPID_KEY === "your_vapid_key_here" ||
        !import.meta.env.VITE_FIREBASE_PROJECT_ID ||
        import.meta.env.VITE_FIREBASE_PROJECT_ID === "your_project_id";

    if (isPlaceholder) {
        console.warn(
            "[FCM] ⚠️  Firebase credentials not configured — push notifications are DISABLED.\n" +
            "     Fill in VITE_FIREBASE_* variables in frontend/.env to enable them.",
        );
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.warn("[FCM] Notification permission denied.");
        return;
    }

    try {
        const messaging = getFirebaseMessaging();

        // Register the Firebase service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
        });

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (!token) {
            console.warn("[FCM] Failed to generate FCM token.");
            return;
        }

        const stored = localStorage.getItem(FCM_TOKEN_KEY);

        if (stored !== token) {
            // Token changed or is new — sync with backend
            await syncTokenWithBackend(token);
            localStorage.setItem(FCM_TOKEN_KEY, token);
            console.log("[FCM] Token registered with backend.");
        }

        // Handle foreground messages
        onMessage(messaging, (payload) => {
            console.log("[FCM] Foreground message received:", payload);

            const title = payload.notification?.title ?? "Notification";
            const body = payload.notification?.body ?? "";

            // Dispatch a custom DOM event so any React component can listen
            window.dispatchEvent(
                new CustomEvent("fcm:message", { detail: { title, body, data: payload.data } }),
            );
        });
    } catch (error) {
        console.error("[FCM] initPushNotifications error:", error);
    }
}
