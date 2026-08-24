import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, Home, Landmark, Receipt, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/shared/lib/online'

const items = [
  { to: '/home', labelKey: 'app.navDashboard', icon: Home, offlineOk: true, exact: true },
  { to: '/expenses', labelKey: 'app.navExpenses', icon: Receipt, offlineOk: true },
  { to: '/accounts', labelKey: 'app.navAccounts', icon: Landmark, offlineOk: true },
  { to: '/assets', labelKey: 'app.navAssets', icon: Coins, offlineOk: false },
  { to: '/profile', labelKey: 'app.navProfile', icon: UserRound, offlineOk: true },
] as const

function isActivePath(pathname: string, to: string, exact?: boolean) {
  if (exact || to === '/home') return pathname === '/home'
  if (to === '/expenses') return pathname.startsWith('/expenses') || pathname.startsWith('/groups')
  if (to === '/assets') return pathname.startsWith('/assets') || pathname.startsWith('/gold') || pathname.startsWith('/stocks')
  if (to === '/profile') {
    return (
      pathname.startsWith('/profile') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/summary')
    )
  }
  return pathname.startsWith(to)
}

export function BottomNav() {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around rounded-t-xl border-t border-gold/40 bg-navy px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t('app.name')}
    >
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.to, 'exact' in item)
        const Icon = item.icon
        const label = t(item.labelKey)
        const disabled = !online && !item.offlineOk
        const fullLabel = disabled ? `${label} — ${t('offline.navDisabled')}` : label

        if (disabled) {
          return (
            <span
              key={item.to}
              role="link"
              aria-disabled="true"
              aria-label={fullLabel}
              title={t('offline.navDisabled')}
              className="flex size-11 cursor-not-allowed items-center justify-center rounded-full opacity-40"
            >
              <Icon className="size-5 text-ivory" aria-hidden />
            </span>
          )
        }

        return (
          <Link
            key={item.to}
            to={item.to}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              isActive && 'bg-gold/20',
            )}
          >
            <Icon className={cn('size-5', isActive ? 'text-gold-bright' : 'text-ivory')} aria-hidden />
          </Link>
        )
      })}
    </nav>
  )
}
