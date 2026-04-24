/**
 * Silent Token Refresh Utility
 *
 * Schedules a proactive refresh call 2 minutes before the access token expires,
 * so users never get logged out due to token expiry during normal usage.
 */

import { api } from './axios';
import { useAuthStore } from '../stores/authStore';

let silentRefreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedules a proactive token refresh.
 * @param expiresIn - Token lifetime in milliseconds (e.g. 900000 for 15 minutes)
 */
export function scheduleSilentRefresh(expiresIn: number): void {
    // Always clear any previously scheduled timer
    clearSilentRefresh();

    // Refresh 2 minutes (120000ms) before expiry. If token lifetime <= 2 min, refresh at 80% of lifetime.
    const bufferMs = Math.min(120_000, expiresIn * 0.2);
    const delay = Math.max(0, expiresIn - bufferMs);

    console.log(`[SilentRefresh] Scheduled in ${Math.round(delay / 1000)}s`);

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

/**
 * Clears any scheduled silent refresh timer.
 * Call this on logout.
 */
export function clearSilentRefresh(): void {
    if (silentRefreshTimer !== null) {
        clearTimeout(silentRefreshTimer);
        silentRefreshTimer = null;
    }
}
