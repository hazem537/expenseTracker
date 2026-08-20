import { CreditCard, Wallet } from 'lucide-react'
import type { Account } from '@/features/accounts'
import { dashboardCard } from '@/features/dashboard/lib/styles'
import { MoneyText } from '@/shared/ui/HideMoney'

function isCardAccount(name: string) {
  return /visa|card|bank|credit/i.test(name)
}

interface AccountCardProps {
  account: Account
  lang: string
}

export function AccountCard({ account, lang }: AccountCardProps) {
  const Icon = isCardAccount(account.name) ? CreditCard : Wallet

  return (
    <article
      className={`${dashboardCard} flex h-[114px] w-40 shrink-0 flex-col justify-end rounded-xl px-4 pb-4 pt-5`}
    >
      <Icon className="mb-auto size-5 text-neutral-800" />
      <p className="text-sm leading-5 text-[#45464d]">{account.name}</p>
      <p className="text-xl font-semibold leading-7 text-black">
        <MoneyText amount={account.balance} lang={lang} currency={account.currency} ledger />
      </p>
    </article>
  )
}
