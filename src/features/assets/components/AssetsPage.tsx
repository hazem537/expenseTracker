import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { GoldPage } from '@/features/gold'
import { StocksPage } from '@/features/stocks'
import { SectionTabs } from '@/shared/ui/SectionTabs'

export function AssetsPage() {
  const { t } = useTranslation()
  const { tab } = useSearch({ from: '/_app/assets' })
  const navigate = useNavigate({ from: '/assets' })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-heading">{t('app.navAssets')}</h1>
      <SectionTabs
        value={tab}
        items={[
          { id: 'gold' as const, label: t('gold.title') },
          { id: 'stocks' as const, label: t('stocks.title') },
        ]}
        onChange={(next) => {
          void navigate({ search: { tab: next } })
        }}
      />
      {tab === 'stocks' ? <StocksPage hideTitle /> : <GoldPage hideTitle />}
    </div>
  )
}
