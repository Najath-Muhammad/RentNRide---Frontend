
import { useEffect } from 'react';
import { api } from '../../utils/axios';
import { useAuthStore } from '../../stores/authStore'; 
import { APIAuthRoutes } from '../../constants/route.constant';

export const AuthInitializer = () => {
  const { setUser, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get(APIAuthRoutes.ME);
        setUser(res.data);
      } catch (err:any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
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

  console.log(`is user authernticated: ${isAuthenticated }`)

  return null;
};