import { createFileRoute } from '@tanstack/react-router'
import SignupPage from '../../pages/auth/Signup'

export const Route = createFileRoute('/auth/signup')({
  component: SignupPage,
})

