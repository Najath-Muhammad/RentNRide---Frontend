import { useEffect } from 'react';
import { AuthApi } from '../../services/api/auth/login.api';
import { useAuthStore } from '../../stores/authStore';
import { connectSocket, disconnectSocket } from '../../services/socket/socket';
export const AuthInitializer = () => {
  const { setUser, setLoading, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
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