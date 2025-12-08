import { createFileRoute } from '@tanstack/react-router'
import Login from '../../pages/admin/Login'

export const Route = createFileRoute('/auth/admin-login')({
  component: Login,
})

