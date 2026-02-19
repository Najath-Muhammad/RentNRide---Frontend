import { createFileRoute } from '@tanstack/react-router'
import EditVehicle from '../../../pages/users/edit.vehicle'

export const Route = createFileRoute('/vehicles/edit/$id')({
  component: EditVehicle,
})


