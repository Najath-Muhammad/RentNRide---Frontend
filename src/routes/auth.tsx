import { createFileRoute,Outlet, redirect } from '@tanstack/react-router'
// import { AuthInitializer } from '../components/auth/AuthInitializer'
// import { api } from '../utils/axios';
// import { APIAuthRoutes } from '../constants/route.constant';
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/auth')({
    beforeLoad: async () => {
     try {
      const { user } = useAuthStore.getState();
      if(user){
        return redirect({
          to: user?.role === 'admin' ? '/admin/dashboard' : '/',
          replace: true,
        });
      }
     } catch (error) {
      console.log('error in auth route')
     }
    },
    component: RouteComponent,
  });
function RouteComponent() {
  return <div>
    {/* <AuthInitializer /> */}
    <Outlet />
  </div>
}
