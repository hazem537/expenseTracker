import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/summary')({
  beforeLoad: () => {
    throw redirect({ to: '/profile', search: { tab: 'summary' } })
  },
})
