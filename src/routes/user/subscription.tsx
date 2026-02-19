import { createFileRoute } from '@tanstack/react-router'
import MySubscription from '../../pages/users/my.subscription'

export const Route = createFileRoute('/user/subscription')({
  component: MySubscription,
})
