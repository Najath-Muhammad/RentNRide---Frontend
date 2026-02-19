import { useEffect } from 'react';
import { AuthApi } from '../../services/api/auth/login.api';
import { useAuthStore } from '../../stores/authStore';
//import type { AxiosError } from 'axios';

export const AuthInitializer = () => {
  const { setUser, setLoading } = useAuthStore();

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

  //console.log(`is user authenticated: ${isAuthenticated}`);

  return null;
};