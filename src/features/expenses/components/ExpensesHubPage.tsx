import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ExpenseGroupsPage } from '@/features/expenseGroups'
import { ExpensesPage } from '@/features/expenses/components/ExpensesPage'
import { SectionTabs } from '@/shared/ui/SectionTabs'

export function ExpensesHubPage() {
  const { t } = useTranslation()
  const { tab } = useSearch({ from: '/_app/expenses' })
  const navigate = useNavigate({ from: '/expenses' })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-heading">{t('expense.pageTitle')}</h1>
      <SectionTabs
        value={tab}
        items={[
          { id: 'expenses' as const, label: t('expense.tabExpenses') },
          { id: 'groups' as const, label: t('expense.tabGroups') },
        ]}
        onChange={(next) => {
          void navigate({ search: { tab: next } })
        }}
      />
      {tab === 'groups' ? <ExpenseGroupsPage hideTitle /> : <ExpensesPage hideTitle />}
    </div>
  )
}
