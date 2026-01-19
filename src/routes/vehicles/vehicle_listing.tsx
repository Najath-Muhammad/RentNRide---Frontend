import { createFileRoute } from '@tanstack/react-router'
import AddVehicleForm from '../../pages/users/VehicleListing'

export const Route = createFileRoute('/vehicles/vehicle_listing')({
  component: AddVehicleForm
})

