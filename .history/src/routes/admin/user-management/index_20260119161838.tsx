import { createFileRoute } from '@tanstack/react-router'
import UserManagementPage from '../../../pages/admin/UserManagement'



export const Route = createFileRoute('/admin/user-management/')({
  component: UserManagementPage,
})