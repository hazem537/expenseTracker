import { createFileRoute } from '@tanstack/react-router'
import { GoldPage } from '@/features/gold'

export const Route = createFileRoute('/_app/gold')({
  component: GoldPage,
})
