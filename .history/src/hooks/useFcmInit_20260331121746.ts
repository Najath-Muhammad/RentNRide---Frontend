import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { initPushNotifications, removeFcmToken } from "../services/fcm.service";

/**
 * Initializes FCM push notifications when the user is authenticated,
 * and removes the token when the user logs out.
 *
 * Mount this hook once — ideally inside App.tsx.
 */
export function useFcmInit() {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            // Small delay so the page is fully loaded before requesting permission
            const timer = setTimeout(() => {
                initPushNotifications().catch((err) =>
                    console.error("[FCM] init error:", err),
                );
            }, 2000);
            return () => clearTimeout(timer);
        }

        // If the user just logged out, clean up the token
        removeFcmToken().catch(() => { });
    }, [isAuthenticated]);
}
