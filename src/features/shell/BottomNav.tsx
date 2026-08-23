import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, Home, Landmark, PieChart, Receipt, Settings, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useOnlineStatus } from '@/shared/lib/online'

const items = [
  { to: '/', labelKey: 'app.navDashboard', icon: Home, offlineOk: true },
  { to: '/summary', labelKey: 'app.navSummary', icon: PieChart, offlineOk: false },
  { to: '/expenses', labelKey: 'app.navExpenses', icon: Receipt, offlineOk: true },
  { to: '/accounts', labelKey: 'app.navAccounts', icon: Landmark, offlineOk: true },
  { to: '/gold', labelKey: 'app.navGold', icon: Coins, offlineOk: false },
  { to: '/stocks', labelKey: 'app.navStocks', icon: TrendingUp, offlineOk: false },
  { to: '/settings', labelKey: 'app.navSettings', icon: Settings, offlineOk: true },
] as const

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
        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
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
