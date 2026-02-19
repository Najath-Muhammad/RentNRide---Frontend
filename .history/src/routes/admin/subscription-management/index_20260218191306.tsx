import { createFileRoute } from '@tanstack/react-router'
imp

export const Route = createFileRoute('/admin/subscription-management/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/subscription-management/"!</div>
}
