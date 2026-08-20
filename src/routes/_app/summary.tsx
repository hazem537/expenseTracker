import { createFileRoute } from '@tanstack/react-router'
import { SummaryPage } from '@/features/dashboard/components/SummaryPage'

export const Route = createFileRoute('/_app/summary')({
  component: SummaryPage,
})
