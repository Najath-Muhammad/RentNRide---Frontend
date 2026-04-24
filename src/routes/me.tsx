import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthApi } from '../services/api/auth/login.api'

export const Route = createFileRoute('/me')({
  beforeLoad: async () => {
    try {
      const res = await AuthApi.getCurrentUser()

      if (!res.success) {
        throw redirect({ to: '/auth/login' })
      }
    } catch {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div><h1>Hello This is a test component</h1></div>
}
