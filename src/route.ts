import { createRouter } from '@tanstack/react-router';
import { routeTree } from "./routeTree.gen";
import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router,
    }
}

export const router = createRouter({
    routeTree,
    context: {
        auth: useAuthStore.getState(),
        queryClient: new QueryClient
    }
})


