import { createRootRoute, Outlet } from '@tanstack/react-router';
import NotFound from '../components/NotFoundComponents/NotFound';


export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: () => (
    <>
      <Outlet />
    </>
  ),
});