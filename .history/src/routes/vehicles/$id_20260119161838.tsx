import { createFileRoute } from '@tanstack/react-router'
import VehicleDetails from '../../pages/vehicles/VehicleDetails'

export const Route = createFileRoute('/vehicles/$id')({
  component: VehicleDetails,
})


