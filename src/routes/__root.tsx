import { createRootRoute, Outlet } from '@tanstack/react-router';
import NotFound from '../components/NotFoundComponents/NotFound';
import { ChatbotWidget } from '../components/common/ChatbotWidget';


export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: () => (
    <>
      <Outlet />
      <ChatbotWidget />
    </>
  ),
});