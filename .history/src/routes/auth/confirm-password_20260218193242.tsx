import { createFileRoute } from '@tanstack/react-router'
import ResetPassword from '../../pages/auth/confirm.password'

export const Route = createFileRoute('/auth/confirm-password')({
  component:ResetPassword,
})

