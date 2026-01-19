import { createFileRoute } from '@tanstack/react-router'
import EditVehicle from '../../../pages/users/EditVehicle'

export const Route = createFileRoute('/vehicles/edit/$id')({
  component: EditVehicle,
})


