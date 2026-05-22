import { useEffect } from 'react';
import { AuthApi } from '../../services/api/auth/login.api';
import { useAuthStore } from '../../stores/authStore';
import { connectSocket, disconnectSocket } from '../../services/socket/socket';
import { api, setSessionToken, clearSessionToken, getSessionToken } from '../../utils/axios';

export const AuthInitializer = () => {
  const { setUser, setLoading, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Step 1: If no token in sessionStorage yet, try a silent refresh first.
        // This handles: page reloads, users who logged in before the Bearer-token
        // fix was deployed, and cross-domain sessions where cookies are blocked.
        if (!getSessionToken()) {
          try {
            const refreshRes = await api.post<{ data: { accessToken?: string } }>(
              '/auth/refresh',
              {},
              { withCredentials: true, _skipAuthRefresh: true } as never
            );
            const newToken = refreshRes.data?.data?.accessToken;
            if (newToken) setSessionToken(newToken);
          } catch {
            // No valid refresh token — user is not logged in. Fall through.
            clearSessionToken();
          }
        }

        // Step 2: Verify the user identity (cookie OR Bearer token via interceptor)
        const res = await AuthApi.getCurrentUser();
        setUser(res.data.user);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'status' in err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          clearSessionToken();
          setUser(null);
        } else {
          console.error('Unexpected error checking auth', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = connectSocket();

      const handleBlocked = () => {
        logout?.();
        disconnectSocket();
        window.location.href = '/auth/login';
      };

      socket.on('user:blocked', handleBlocked);

      return () => {
        socket.off('user:blocked', handleBlocked);
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, logout]);

  return null;
};