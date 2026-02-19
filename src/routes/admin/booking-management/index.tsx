
import { createFileRoute } from '@tanstack/react-router'
import BookingManagement from '../../../pages/admin/booking.management'

export const Route = createFileRoute('/admin/booking-management/')({
  component: BookingManagement,
})
