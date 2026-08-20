import { Wallet } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { HideMoneyButton } from '@/shared/ui/HideMoney'

interface AppHeaderProps {
  signedIn: boolean
  onSignOut?: () => void
}

export function AppHeader({ signedIn, onSignOut }: AppHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="bg-[#fcf8fa]">
      <div className="mx-auto flex h-12 max-w-[768px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full">
            <Wallet className="size-[18px] text-black" />
          </span>
          <p className="text-xl font-semibold leading-7 text-black">{t('app.name')}</p>
        </div>
        <div className="flex items-center gap-1">
          <HideMoneyButton />
          <LanguageToggle compact />
          {signedIn && onSignOut ? (
            <button
              type="button"
              className="hidden min-h-10 rounded-lg px-3 text-sm font-medium text-[#45464d] hover:bg-white md:inline"
              onClick={onSignOut}
            >
              {t('app.signOut')}
            </button>
          ) : null}
        </div>
      </div>
      {signedIn ? (
        <nav className="mx-auto hidden max-w-[768px] gap-2 px-4 pb-2 md:flex">
          <Link
            to="/"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navDashboard')}
          </Link>
          <Link
            to="/expenses"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navExpenses')}
          </Link>
          <Link
            to="/accounts"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navAccounts')}
          </Link>
          <Link
            to="/gold"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navGold')}
          </Link>
          <Link
            to="/stocks"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navStocks')}
          </Link>
          <Link
            to="/settings"
            activeProps={{ className: 'rounded-full bg-[#131b2e] px-3 py-2 text-sm font-medium text-white' }}
            className="rounded-full px-3 py-2 text-sm font-medium text-[#45464d] hover:bg-white"
          >
            {t('app.navSettings')}
          </Link>
        </nav>
      ) : null}
    </header>
  )
}
