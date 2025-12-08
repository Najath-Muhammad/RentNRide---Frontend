import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../utils/axios'

export const Route = createFileRoute('/me')({
  beforeLoad: async () => {
    try {
      const res = await api.get('/auth/me')

      if (!res.data.success) {
        throw redirect({ to: '/auth/login' })
      }

    } catch (error) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div><h1>Hello This is a test component</h1></div>
}
