import { createFileRoute } from '@tanstack/react-router'
imp

export const Route = createFileRoute('/auth/admin-login')({
  component: AdminLogin,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
})

