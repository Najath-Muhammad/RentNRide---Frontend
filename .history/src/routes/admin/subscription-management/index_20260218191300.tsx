import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/admin/subscription-management/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/subscription-management/"!</div>
}
