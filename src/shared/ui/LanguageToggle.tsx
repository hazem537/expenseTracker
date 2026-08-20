import { useTranslation } from 'react-i18next'

interface LanguageToggleProps {
  compact?: boolean
}

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('ar') ? 'ar' : 'en'

  if (compact) {
    return (
      <button
        type="button"
        className="rounded-full px-2 py-2 text-sm leading-5 text-ink"
        onClick={() => void i18n.changeLanguage(current === 'ar' ? 'en' : 'ar')}
      >
        {t('lang.toggle')}
      </button>
    )
  }

  return (
    <div className="inline-flex rounded-full border border-gold-soft bg-surface p-1">
      <button
        type="button"
        className={`min-h-10 min-w-12 rounded-full px-3 text-sm font-semibold ${
          current === 'ar' ? 'bg-navy text-gold-bright' : 'text-muted hover:text-heading'
        }`}
        onClick={() => void i18n.changeLanguage('ar')}
      >
        {t('lang.ar')}
      </button>
      <button
        type="button"
        className={`min-h-10 min-w-12 rounded-full px-3 text-sm font-semibold ${
          current === 'en' ? 'bg-navy text-gold-bright' : 'text-muted'
        }`}
        onClick={() => void i18n.changeLanguage('en')}
      >
        {t('lang.en')}
      </button>
    </div>
  )
}
