import { createFileRoute } from '@tanstack/react-router'
import ForgotPassword from '../../pages/auth/Fogot-password'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPassword,
})

