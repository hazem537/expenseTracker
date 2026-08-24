import { createFileRoute } from '@tanstack/react-router'
import { ExpensesHubPage } from '@/features/expenses/components/ExpensesHubPage'

export const Route = createFileRoute('/_app/expenses')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === 'groups' ? ('groups' as const) : ('expenses' as const),
  }),
  component: ExpensesHubPage,
})
