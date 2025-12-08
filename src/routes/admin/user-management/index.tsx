import { createFileRoute } from '@tanstack/react-router'
import UserManagementPage from '../../../pages/admin/UserManagement'
import { api } from '../../../utils/axios'

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "Normal" | "Premium";
  status: "Active" | "Blocked";
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Route = createFileRoute('/admin/user-management/')({
  component: UserManagementPage,
})