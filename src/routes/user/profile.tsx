import { createFileRoute } from '@tanstack/react-router'
import Profile from '../../pages/users/profile'

export const Route = createFileRoute('/user/profile')({
  component: Profile,
})
