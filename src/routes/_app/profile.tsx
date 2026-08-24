import { createFileRoute } from '@tanstack/react-router'
import { ProfileHubPage } from '@/features/settings/components/ProfileHubPage'

export const Route = createFileRoute('/_app/profile')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      search.tab === 'settings'
        ? ('settings' as const)
        : search.tab === 'summary'
          ? ('summary' as const)
          : ('profile' as const),
  }),
  component: ProfileHubPage,
})
