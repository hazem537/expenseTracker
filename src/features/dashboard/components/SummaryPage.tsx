import { useTranslation } from 'react-i18next'
import { useAccounts } from '@/features/accounts'
import { WealthOverview } from '@/features/dashboard/components/WealthOverview'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function SummaryPage() {
  const { t, i18n } = useTranslation()
  const { accounts } = useAccounts()

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <h1 className="text-2xl font-bold text-heading">{t('app.navSummary')}</h1>
      <p className="text-sm text-muted">{t('dashboard.summaryHelp')}</p>
      <WealthOverview accounts={accounts} lang={i18n.language} />
    </div>
  )
}
