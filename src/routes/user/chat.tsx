import { createFileRoute } from '@tanstack/react-router'
import ChatPage from '../../pages/users/chat'

export const Route = createFileRoute('/user/chat')({
    component: ChatPage,
})
