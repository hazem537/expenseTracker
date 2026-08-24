import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/groups')({
  beforeLoad: () => {
    throw redirect({ to: '/expenses', search: { tab: 'groups' } })
  },
})
