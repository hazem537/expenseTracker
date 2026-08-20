import { Link, useRouterState } from '@tanstack/react-router'
import { Coins, LayoutDashboard, LineChart, Receipt, Settings, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const items = [
  { to: '/', labelKey: 'app.navDashboard', icon: LayoutDashboard },
  { to: '/expenses', labelKey: 'app.navExpenses', icon: Receipt },
  { to: '/accounts', labelKey: 'app.navAccounts', icon: Wallet },
  { to: '/gold', labelKey: 'app.navGold', icon: Coins },
  { to: '/stocks', labelKey: 'app.navStocks', icon: LineChart },
  { to: '/settings', labelKey: 'app.navSettings', icon: Settings },
] as const

export function BottomNav() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around rounded-t-xl bg-white px-1 shadow-[0px_-1px_1.5px_rgba(15,23,42,0.03)] md:hidden">
      {items.map((item) => {
        const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center px-1 py-1',
              isActive && 'rounded-full bg-[#131b2e]',
            )}
          >
            <Icon className={cn('size-[18px]', isActive ? 'text-white' : 'text-[#45464d]')} />
            <span
              className={cn(
                'pt-1 text-xs font-semibold tracking-[0.6px]',
                isActive ? 'text-[#7c839b]' : 'text-[#45464d]',
              )}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
