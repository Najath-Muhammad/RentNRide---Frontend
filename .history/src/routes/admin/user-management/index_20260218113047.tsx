import { createFileRoute } from '@tanstack/react-router'
import UserManagementPage from '../../../pages/admin/user.management'



export const Route = createFileRoute('/admin/user-management/')({
  component: UserManagementPage,
})