import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../stores/authStore';

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    try {
      const { user } = useAuthStore.getState();
      if (user) {
        return redirect({
          to: user?.role === 'admin' ? '/admin/dashboard' : '/',
          replace: true,
        });
      }
    } catch (error) {}
  },
  component: RouteComponent,
});
function RouteComponent() {
  return (
    <div>
      {}
      <Outlet />
    </div>
  );
}
