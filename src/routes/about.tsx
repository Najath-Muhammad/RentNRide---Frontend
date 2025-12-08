import {  createFileRoute } from '@tanstack/react-router'
import { api } from '../utils/axios';

export const Route = createFileRoute('/about')({
  beforeLoad: async () => {
    try {
        const response = await api.get('/auth/me');

        return { userData: response.data };

      } catch (error: any) {
        if (error.response?.status === 401) {
          throw error
          
        }
      }
  },
  component: RouteComponent,

})

function RouteComponent() {
  return (
    <div>
      <div>Hello najath!</div>
    </div>
  );
}
