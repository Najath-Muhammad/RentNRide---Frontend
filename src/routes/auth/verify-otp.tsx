import { createFileRoute } from '@tanstack/react-router'
import VerifyOtp from '../../pages/auth/Verify-otp'

export const Route = createFileRoute('/auth/verify-otp')({
  component: VerifyOtp,
})


