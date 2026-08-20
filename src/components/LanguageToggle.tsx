import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('ar') ? 'ar' : 'en'

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
