import { createFileRoute } from '@tanstack/react-router'
import VerifyOtp from '../../pages/auth/verify.otp'

export const Route = createFileRoute('/auth/verify-otp')({
  component: VerifyOtp,
})


