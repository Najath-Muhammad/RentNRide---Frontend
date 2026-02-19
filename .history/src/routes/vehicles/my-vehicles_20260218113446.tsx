import { createFileRoute } from '@tanstack/react-router'
import MyVehicles from '../../pages/users/users.vehicles'

export const Route = createFileRoute('/vehicles/my-vehicles')({
  component: MyVehicles,
})

