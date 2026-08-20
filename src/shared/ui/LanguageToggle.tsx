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
        className="rounded-full px-2 py-2 text-sm leading-5 text-[#45464d]"
        onClick={() => void i18n.changeLanguage(current === 'ar' ? 'en' : 'ar')}
      >
        {t('lang.toggle')}
      </button>
    )
  }

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        className={`min-h-10 min-w-12 rounded-full px-3 text-sm font-semibold ${
          current === 'ar' ? 'bg-slate-900 text-white' : 'text-slate-600'
        }`}
        onClick={() => void i18n.changeLanguage('ar')}
      >
        {t('lang.ar')}
      </button>
      <button
        type="button"
        className={`min-h-10 min-w-12 rounded-full px-3 text-sm font-semibold ${
          current === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600'
        }`}
        onClick={() => void i18n.changeLanguage('en')}
      >
        {t('lang.en')}
      </button>
    </div>
  )
}
