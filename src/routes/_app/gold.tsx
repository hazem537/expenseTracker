import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/gold')({
  beforeLoad: () => {
    throw redirect({ to: '/assets', search: { tab: 'gold' } })
  },
})
