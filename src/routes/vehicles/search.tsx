import { createFileRoute } from '@tanstack/react-router'
import SearchPage from '../../pages/vehicles/vehicle.search'

export const Route = createFileRoute('/vehicles/search')({
  component: SearchPage,
})


