import { useTranslation } from 'react-i18next'

export function SetupNotice() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <p className="font-semibold">{t('app.setupTitle')}</p>
      <p className="mt-1 text-sm">{t('app.setupBody')}</p>
    </div>
  )
}
