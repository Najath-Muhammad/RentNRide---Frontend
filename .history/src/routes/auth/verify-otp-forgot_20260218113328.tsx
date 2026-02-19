import { createFileRoute } from '@tanstack/react-router'
import VerifyOtp from '../../pages/auth/verify-otp.forgot'

export const Route = createFileRoute('/auth/verify-otp-forgot')({
  component: VerifyOtp,
})


