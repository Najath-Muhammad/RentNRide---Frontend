import { createFileRoute } from '@tanstack/react-router'
import { type AxiosError } from 'axios';
import { AuthApi } from '../services/api/auth/login.api';

export const Route = createFileRoute('/about')({
  beforeLoad: async () => {
    try {
      const response = await AuthApi.getCurrentUser();

      return { userData: response };

    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401) {
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
