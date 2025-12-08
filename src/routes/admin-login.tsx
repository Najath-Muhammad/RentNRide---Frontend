import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminLogin from '../pages/admin/Login'
import { api } from '../utils/axios';
import { APIAuthRoutes } from '../constants/route.constant';

export const Route = createFileRoute('/admin-login')({
    beforeLoad: async () => {
        try {
          const response = await api.get(APIAuthRoutes.ME);
    
          if (response.data.success && response.data.user.role === 'admin') {
              throw redirect({
              to: '/admin/dashboard' 
            });
          }
    
        } catch (error: any) {
          if (error.response?.status === 401) {
            return { isGuest: true };
          }
          throw error;
        }
    },
    component: AdminLogin,
})


