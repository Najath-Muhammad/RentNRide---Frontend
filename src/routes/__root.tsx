import { createRootRoute, Outlet } from '@tanstack/react-router';
import GuestNotFound from '../components/NotFoundComponents/GuestNotFound'; 


export const Route = createRootRoute({

  notFoundComponent:GuestNotFound,

  component: () => (
    <>
      <Outlet />
    </>
  ),
});