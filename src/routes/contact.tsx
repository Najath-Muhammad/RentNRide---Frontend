import { createFileRoute } from '@tanstack/react-router'
import Contact from '../pages/user/Contact'

export const Route = createFileRoute('/contact')({
  component: Contact,
})
