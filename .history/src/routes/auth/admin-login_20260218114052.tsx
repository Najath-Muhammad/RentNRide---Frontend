import { createFileRoute } from '@tanstack/react-router'
import AdminLogin from '../../pages/admin/Login'

export const Route = createFileRoute('/auth/admin-login')({
  component: Adm,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    return {
      redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    }
  },
})

