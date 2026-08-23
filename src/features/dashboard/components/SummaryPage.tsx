import { useTranslation } from 'react-i18next'
import { useAccounts } from '@/features/accounts'
import { WealthOverview } from '@/features/dashboard/components/WealthOverview'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function SummaryPage() {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const { accounts } = useAccounts()

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <h1 className="text-2xl font-bold text-heading">{t('app.navSummary')}</h1>
      {!online ? (
        <p className="rounded-xl border border-amber-300/80 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100" role="status">
          {t('offline.pageUnavailable')}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">{t('dashboard.summaryHelp')}</p>
          <WealthOverview accounts={accounts} lang={i18n.language} />
        </>
      )}
    </div>
  )
}
