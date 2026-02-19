import { createFileRoute } from '@tanstack/react-router'
import AdminLog

export const Route = createFileRoute('/auth/admin-login')({
  component: AdminLogin,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
})

