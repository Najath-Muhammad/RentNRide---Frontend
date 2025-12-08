import { createFileRoute, Outlet,redirect } from '@tanstack/react-router'
import { api } from '../utils/axios';
import { AuthInitializer } from '../components/auth/AuthInitializer';
import { APIAuthRoutes } from '../constants/route.constant';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    try {
      const response = await api.get(APIAuthRoutes.ME);

      if (!response.data.user || !response.data.success || response.data.user.role !== 'admin') {
        throw redirect({
          to: '/auth/admin-login',
          search: {
            redirect: location.href,
          },
        });
      }

      return { userData: response.data };

    } catch (error: any) {
      if (error.response?.status === 401 || error.name === 'RedirectError') {
        throw redirect({
          to: '/auth/admin-login',
          search: {
            redirect: location.href,
          },
        });
      }
      throw error;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      {/* <AuthInitializer/> */}
      <Outlet />
    </div>  
    )
}

