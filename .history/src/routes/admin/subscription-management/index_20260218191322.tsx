import { createFileRoute } from '@tanstack/react-router'
import SubscriptionManagement from '../../../pages/admin/subscription.management'

export const Route = createFileRoute('/admin/subscription-management/')({
  component: SubscriptionManagement,
})

