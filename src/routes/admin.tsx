import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AxiosError } from 'axios';
import { AuthApi } from '../services/api/auth/login.api'
import AdminNotFound from '../components/NotFoundComponents/AdminNotFound'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    try {
      const response = await AuthApi.getCurrentUser()
      const payload = (response as any).data || response

      if (payload.user && payload.user.role === 'admin') {
        return { userData: response }
      }
      throw redirect({
        to: '/auth/admin-login',
        search: {
          redirect: location.href,
        },
      })

    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401 || err.isAxiosError) {
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
  notFoundComponent: AdminNotFound,
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  )
}