import { createFileRoute } from '@tanstack/react-router'
import MyVehicles from '../../pages/users/UsersVehicles'

export const Route = createFileRoute('/vehicles/my-vehicles')({
  component: MyVehicles,
})

