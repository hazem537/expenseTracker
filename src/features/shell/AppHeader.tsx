import { Wallet } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { HideMoneyButton } from '@/shared/ui/HideMoney'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'

interface AppHeaderProps {
  signedIn: boolean
  onSignOut?: () => void
}

const navIdle =
  'rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-navy hover:text-gold-bright'
const navActive =
  'rounded-full bg-navy px-3 py-2 text-sm font-medium text-ivory ring-1 ring-gold/50 dark:text-gold-bright'

export function AppHeader({ signedIn, onSignOut }: AppHeaderProps) {
  const { t } = useTranslation()

  return (
    <header>
      <div className="mx-auto flex h-12 max-w-[768px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-navy">
            <Wallet className="size-[18px] text-gold-bright" />
          </span>
          <p className="font-header text-xl font-semibold leading-7 tracking-wide text-heading">{t('app.name')}</p>
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
        <nav className="mx-auto hidden max-w-[768px] gap-2 px-4 pb-2 md:flex">
          <Link to="/" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navDashboard')}
          </Link>
          <Link to="/summary" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navSummary')}
          </Link>
          <Link to="/expenses" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navExpenses')}
          </Link>
          <Link to="/accounts" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navAccounts')}
          </Link>
          <Link to="/gold" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navGold')}
          </Link>
          <Link to="/stocks" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navStocks')}
          </Link>
          <Link to="/settings" activeProps={{ className: navActive }} className={navIdle}>
            {t('app.navSettings')}
          </Link>
        </nav>
      ) : null}
    </header>
  )
}
