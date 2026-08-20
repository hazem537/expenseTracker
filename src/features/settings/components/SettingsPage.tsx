import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { GoldPricesSection } from '@/features/gold'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { CURRENCIES, type CurrencyCode } from '@/shared/lib/currencies'
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase'
import { InstallAppCard } from '@/shared/ui/InstallAppCard'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function SettingsPage() {
  const { t } = useTranslation()
  const { profile, loading, error, saveDefaultCurrency } = useProfile()
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) setCurrency(profile.default_currency)
  }, [profile])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setSaved(false)
    try {
      await saveDefaultCurrency(currency)
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <h1 className="text-2xl font-bold text-heading">{t('app.navSettings')}</h1>
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {profile ? (
        <form className="space-y-4 rounded-2xl border border-gold-soft/70 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.08)]" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label className="block text-sm font-medium text-heading" htmlFor="base-cur">
              {t('settings.defaultCurrency')}
            </label>
            <p className="mt-1 text-sm text-muted">{t('settings.defaultCurrencyHelp')}</p>
            <select
              id="base-cur"
              className="mt-2 min-h-12 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          {saved ? <p className="text-sm text-emerald-700">{t('settings.saved')}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 w-full rounded-xl bg-navy font-semibold text-gold-bright disabled:opacity-60"
          >
            {t('app.save')}
          </button>
        </form>
      ) : null}
      {profile ? <GoldPricesSection /> : null}
      <InstallAppCard />
      <button
        type="button"
        className="min-h-12 w-full rounded-xl border border-gold-soft bg-surface font-medium text-muted md:hidden"
        onClick={() => {
          void supabase?.auth.signOut()
        }}
      >
        {t('app.signOut')}
      </button>
    </div>
  )
}
