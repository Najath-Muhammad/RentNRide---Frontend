import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { initPushNotifications, removeFcmToken } from "../services/fcm.service";


export function useFcmInit() {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => {
                initPushNotifications().catch((err) =>
                    console.error("[FCM] init error:", err),
                );
            }, 2000);
            return () => clearTimeout(timer);
        }
        removeFcmToken().catch(() => { });
    }, [isAuthenticated]);
}
