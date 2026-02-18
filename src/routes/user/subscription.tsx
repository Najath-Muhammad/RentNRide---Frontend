import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/user/subscription')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/user/subscription"!</div>
}
