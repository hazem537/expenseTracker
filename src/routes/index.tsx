import { createFileRoute, redirect } from '@tanstack/react-router'
import { LandingPage } from '@/features/landing'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/home' })
    }
  },
  component: LandingPage,
})
