import { Outlet, createFileRoute } from '@tanstack/react-router'
import Navbar from '../components/user/Navbar'
//import { api } from '../utils/axios';
//import { AuthInitializer } from '../components/auth/AuthInitializer';

export const Route = createFileRoute('/')({
//   beforeLoad: async () => {
//     try {
//       const response = await api.get('/auth/me');

//       return { userData: response.data };

//     } catch (error: any) {
//       if (error.response?.status === 401) {
//         throw error
        
//       }
//     }
// },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      {/* <AuthInitializer/> */}
      <Navbar />
      <Outlet />
    </div>  
    )
}
