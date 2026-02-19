import { createFileRoute } from '@tanstack/react-router'
import AdminVehicleControl from '../../../pages/admin/vehicle.management'

export const Route = createFileRoute('/admin/vehicle-management/')({
  component: AdminVehicleControl,
})

