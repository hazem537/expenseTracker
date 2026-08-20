import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, Home, Landmark, PieChart, Receipt, Settings, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', labelKey: 'app.navDashboard', icon: Home },
  { to: '/summary', labelKey: 'app.navSummary', icon: PieChart },
  { to: '/expenses', labelKey: 'app.navExpenses', icon: Receipt },
  { to: '/accounts', labelKey: 'app.navAccounts', icon: Landmark },
  { to: '/gold', labelKey: 'app.navGold', icon: Coins },
  { to: '/stocks', labelKey: 'app.navStocks', icon: TrendingUp },
  { to: '/settings', labelKey: 'app.navSettings', icon: Settings },
] as const

export function BottomNav() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around rounded-t-xl bg-white px-2 shadow-[0px_-1px_1.5px_rgba(15,23,42,0.03)] md:hidden">
      {items.map((item) => {
        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
        const Icon = item.icon
        const label = t(item.labelKey)
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-label={label}
            title={label}
            className={cn(
              'flex size-11 items-center justify-center rounded-full',
              isActive && 'bg-[#131b2e]',
            )}
          >
            <Icon className={cn('size-5', isActive ? 'text-white' : 'text-[#45464d]')} />
          </Link>
        )
      })}
    </nav>
  )
}
