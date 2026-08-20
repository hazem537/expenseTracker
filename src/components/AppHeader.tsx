import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from './LanguageToggle'

interface AppHeaderProps {
  signedIn: boolean
  onSignOut?: () => void
}

export function AppHeader({ signedIn, onSignOut }: AppHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-lg font-bold text-slate-900">{t('app.name')}</p>
          {signedIn ? (
            <nav className="flex gap-2">
              <Link
                to="/"
                activeProps={{ className: 'active bg-slate-900 text-white' }}
                className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t('app.navDashboard')}
              </Link>
              <Link
                to="/expenses"
                activeProps={{ className: 'active bg-slate-900 text-white' }}
                className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t('app.navExpenses')}
              </Link>
            </nav>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {signedIn && onSignOut ? (
            <button
              type="button"
              className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              onClick={onSignOut}
            >
              {t('app.signOut')}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
