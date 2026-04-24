import { useEffect, useState } from "react";

export interface FcmToastMessage {
    id: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

export function useFcmToast() {
    const [toasts, setToasts] = useState<FcmToastMessage[]>([]);

    useEffect(() => {
        function handler(e: Event) {
            const { title, body, data } = (e as CustomEvent).detail as {
                title: string;
                body: string;
                data?: Record<string, string>;
            };

            const toast: FcmToastMessage = {
                id: `${Date.now()}-${Math.random()}`,
                title,
                body,
                data,
            };

            setToasts((prev) => [...prev, toast]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 5000);
        }

        window.addEventListener("fcm:message", handler);
        return () => window.removeEventListener("fcm:message", handler);
    }, []);

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return { toasts, dismiss };
}
