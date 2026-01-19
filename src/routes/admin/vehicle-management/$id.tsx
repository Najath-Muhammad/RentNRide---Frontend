import { createFileRoute } from '@tanstack/react-router'
import VehicleDetailsPage from '../../../pages/admin/VehicleDetails'

export const Route = createFileRoute('/admin/vehicle-management/$id')({
    component: VehicleDetailsPage,
})


