import { createFileRoute } from '@tanstack/react-router'
import WalletPage from '../../pages/users/wallet'

export const Route = createFileRoute('/user/wallet')({
  component: WalletPage,
})


