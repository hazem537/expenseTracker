import { createFileRoute } from '@tanstack/react-router'
import { AssetsPage } from '@/features/assets/components/AssetsPage'

export const Route = createFileRoute('/_app/assets')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === 'stocks' ? ('stocks' as const) : ('gold' as const),
  }),
  component: AssetsPage,
})
