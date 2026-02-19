import { createFileRoute } from '@tanstack/react-router'
import MyBookings from '../../pages/users/my.bookings'

export const Route = createFileRoute('/user/my-bookings')({
    component: MyBookings,
})
