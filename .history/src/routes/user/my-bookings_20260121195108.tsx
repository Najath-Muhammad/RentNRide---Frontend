import { createFileRoute } from '@tanstack/react-router'
import MyBookings from '../../pages/users/MyBookings'

export const Route = createFileRoute('/user/my-bookings')({
    component: MyBookings,
})
