import { createFileRoute } from '@tanstack/react-router'
import VehicleDetails from '../../pages/vehicles/vehicle.details'

export const Route = createFileRoute('/vehicles/$id')({
  component: VehicleDetails,
})


