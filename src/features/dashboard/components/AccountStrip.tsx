import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import type { Account } from '@/features/accounts'
import type { AccountFormValues } from '@/features/accounts/components/AccountForm'
import { AccountCard } from '@/features/dashboard/components/AccountCard'
import { AddAccountCard } from '@/features/dashboard/components/AddAccountCard'
import type { CurrencyCode } from '@/shared/lib/currencies'

interface AccountStripProps {
  accounts: Account[]
  lang: string
  defaultCurrency: CurrencyCode
  onCreateAccount: (values: AccountFormValues) => Promise<void>
}

export function AccountStrip({
  accounts,
  lang,
  defaultCurrency,
  onCreateAccount,
}: AccountStripProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold leading-7 text-heading">{t('app.navAccounts')}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {accounts.map((item) => (
          <AccountCard key={item.id} account={item} lang={lang} />
        ))}
        <AddAccountCard onClick={() => setOpen(true)} />
      </div>
      <AccountFormDialog
        open={open}
        onOpenChange={setOpen}
        defaultCurrency={defaultCurrency}
        onSubmit={async (values) => {
          await onCreateAccount(values)
          setOpen(false)
        }}
      />
    </section>
  )
}
