import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { HideMoneyButton } from '@/shared/ui/HideMoney'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { useOnlineStatus } from '@/shared/lib/online'
import { cn } from '@/lib/utils'
import { AppLogo } from './AppLogo'

interface AppHeaderProps {
  signedIn: boolean
  onSignOut?: () => void
}

const navIdle =
  'rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-navy hover:text-gold-bright'
const navActive =
  'rounded-full bg-navy px-3 py-2 text-sm font-medium text-ivory ring-1 ring-gold/50 dark:text-gold-bright'
const navDisabled =
  'cursor-not-allowed rounded-full px-3 py-2 text-sm font-medium text-muted opacity-50'

const desktopLinks = [
  { to: '/home', labelKey: 'app.navDashboard', exact: true, offlineOk: true },
  { to: '/expenses', labelKey: 'app.navExpenses', offlineOk: true },
  { to: '/accounts', labelKey: 'app.navAccounts', offlineOk: true },
  { to: '/assets', labelKey: 'app.navAssets', offlineOk: false },
  { to: '/profile', labelKey: 'app.navProfile', offlineOk: true },
] as const

export function AppHeader({ signedIn, onSignOut }: AppHeaderProps) {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <header>
      <div className="mx-auto flex h-12 max-w-[768px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <AppLogo />
        </div>
        <div className="flex items-center gap-1">
          <HideMoneyButton />
          <ThemeToggle />
          <LanguageToggle compact />
          {signedIn && onSignOut ? (
            <button
              type="button"
              className="hidden min-h-10 rounded-lg px-3 text-sm font-medium text-ink hover:bg-navy hover:text-gold-bright md:inline"
              onClick={onSignOut}
            >
              {t('app.signOut')}
            </button>
          ) : null}
        </div>
      </div>
      {signedIn ? (
        <nav className="mx-auto hidden max-w-[768px] gap-2 px-4 pb-2 md:flex" aria-label={t('app.name')}>
          {desktopLinks.map((item) => {
            const isActive =
              'exact' in item && item.exact
                ? pathname === item.to
                : item.to === '/home'
                  ? pathname === '/home'
                  : item.to === '/expenses'
                    ? pathname.startsWith('/expenses') || pathname.startsWith('/groups')
                    : item.to === '/assets'
                      ? pathname.startsWith('/assets') || pathname.startsWith('/gold') || pathname.startsWith('/stocks')
                      : item.to === '/profile'
                        ? pathname.startsWith('/profile') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/summary')
                        : pathname.startsWith(item.to)
            const disabled = !online && !item.offlineOk
            if (disabled) {
              return (
                <span
                  key={item.to}
                  role="link"
                  aria-disabled="true"
                  aria-label={`${t(item.labelKey)} — ${t('offline.navDisabled')}`}
                  title={t('offline.navDisabled')}
                  className={navDisabled}
                >
                  {t(item.labelKey)}
                </span>
              )
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                activeProps={{ className: navActive }}
                className={cn(navIdle)}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </header>
  )
}
