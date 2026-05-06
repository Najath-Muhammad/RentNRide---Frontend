import { createFileRoute } from '@tanstack/react-router'
import OwnerDashboardPage from '../../pages/users/owner.dashboard'

export const Route = createFileRoute('/user/owner-dashboard')({
  component: OwnerDashboardPage,
})
