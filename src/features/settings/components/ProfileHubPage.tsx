import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SummaryPage } from '@/features/dashboard/components/SummaryPage'
import { ProfilePage } from '@/features/settings/components/ProfilePage'
import { SettingsPage } from '@/features/settings/components/SettingsPage'
import { SectionTabs } from '@/shared/ui/SectionTabs'

export function ProfileHubPage() {
  const { t } = useTranslation()
  const { tab } = useSearch({ from: '/_app/profile' })
  const navigate = useNavigate({ from: '/profile' })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-heading">{t('profile.title')}</h1>
      <SectionTabs
        value={tab}
        items={[
          { id: 'profile' as const, label: t('profile.title') },
          { id: 'settings' as const, label: t('settings.title') },
          { id: 'summary' as const, label: t('app.navSummary') },
        ]}
        onChange={(next) => {
          void navigate({ search: { tab: next } })
        }}
      />
      {tab === 'settings' ? (
        <SettingsPage hideTitle />
      ) : tab === 'summary' ? (
        <SummaryPage hideTitle />
      ) : (
        <ProfilePage hideTitle />
      )}
    </div>
  )
}
