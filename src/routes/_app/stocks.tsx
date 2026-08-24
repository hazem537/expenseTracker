import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/stocks')({
  beforeLoad: () => {
    throw redirect({ to: '/assets', search: { tab: 'stocks' } })
  },
})
