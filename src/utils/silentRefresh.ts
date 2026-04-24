import { api } from './axios';
import { useAuthStore } from '../stores/authStore';

let silentRefreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSilentRefresh(expiresIn: number): void {
    clearSilentRefresh();

    const bufferMs = Math.min(120_000, expiresIn * 0.2);
    const delay = Math.max(0, expiresIn - bufferMs);

    silentRefreshTimer = setTimeout(async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        try {
            const response = await api.post<{ data: { expiresIn?: number } }>(
                '/auth/refresh',
                {},
                { withCredentials: true }
            );

            const newExpiresIn = response.data?.data?.expiresIn;
            if (newExpiresIn) {
                useAuthStore.getState().setTokenExpiry(Date.now() + newExpiresIn);
                scheduleSilentRefresh(newExpiresIn);
            }
        } catch {
            console.warn('[SilentRefresh] Refresh failed, user may be logged out on next request.');
        }
    }, delay);
}

export function clearSilentRefresh(): void {
    if (silentRefreshTimer !== null) {
        clearTimeout(silentRefreshTimer);
        silentRefreshTimer = null;
    }
}
