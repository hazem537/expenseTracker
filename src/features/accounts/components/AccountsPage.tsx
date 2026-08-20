import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { AccountList } from '@/features/accounts/components/AccountList'
import { AccountsHeader } from '@/features/accounts/components/AccountsHeader'
import { AddMoneyDialog } from '@/features/accounts/components/AddMoneyDialog'
import { RecentTransfers } from '@/features/accounts/components/RecentTransfers'
import { TransferDialog } from '@/features/accounts/components/TransferDialog'
import { useAccounts, type Account } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import { useProfile } from '@/features/settings'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function AccountsPage() {
  const { t, i18n } = useTranslation()
  const { profile } = useProfile()
  const { accounts, transfers, loading, error, createAccount, addMoney, updateAccount, deleteAccount, transfer } =
    useAccounts()
  const lang = i18n.language
  const defaultCurrency = profile?.default_currency ?? 'USD'

  const [createOpen, setCreateOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [depositAccount, setDepositAccount] = useState<Account | null>(null)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cache = new Map<string, number>()
      const converted: Record<string, number> = {}
      let total = 0
      for (const account of accounts) {
        let rate = cache.get(account.currency)
        if (rate == null) {
          try {
            rate = await fetchExchangeRate(account.currency, defaultCurrency)
          } catch {
            rate = account.currency === defaultCurrency ? 1 : 0
          }
          cache.set(account.currency, rate)
        }
        const value = convertAmount(account.balance, rate)
        converted[account.id] = value
        total += value
      }
      const next: Record<string, number> = {}
      if (total > 0) {
        for (const account of accounts) {
          next[account.id] = (converted[account.id] / total) * 100
        }
      }
      if (!cancelled) setWeights(next)
    })()
    return () => {
      cancelled = true
    }
  }, [accounts, defaultCurrency])

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <AccountsHeader
        canTransfer={accounts.length >= 2}
        onAddAccount={() => setCreateOpen(true)}
        onTransfer={() => setTransferOpen(true)}
      />
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {actionError ? <p className="text-red-600">{actionError}</p> : null}
      <AccountList
        accounts={accounts}
        lang={lang}
        loading={loading}
        weights={weights}
        onAddMoney={setDepositAccount}
        onEdit={setEditAccount}
        onDelete={(account) => {
          if (!window.confirm(t('accounts.confirmDelete'))) return
          setActionError(null)
          void deleteAccount(account.id).catch((err: unknown) => {
            const message = err instanceof Error ? err.message : ''
            setActionError(message === 'HAS_EXPENSES' ? t('accounts.cannotDelete') : t('expense.error'))
          })
        }}
      />
      <RecentTransfers transfers={transfers} accounts={accounts} lang={lang} />
      <AccountFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultCurrency={defaultCurrency}
        onSubmit={async (values) => {
          await createAccount(values)
          setCreateOpen(false)
        }}
      />
      <AccountFormDialog
        open={editAccount != null}
        account={editAccount}
        onOpenChange={(open) => {
          if (!open) setEditAccount(null)
        }}
        defaultCurrency={defaultCurrency}
        onSubmit={async (values) => {
          if (!editAccount) return
          await updateAccount(editAccount.id, {
            name: values.name,
            currency: values.currency,
            balance: values.openingBalance,
          })
          setEditAccount(null)
        }}
      />
      <AddMoneyDialog
        account={depositAccount}
        onOpenChange={(open) => {
          if (!open) setDepositAccount(null)
        }}
        onSubmit={addMoney}
      />
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={accounts}
        onSubmit={async (input) => {
          await transfer({
            ...input,
            occurredOn: new Date().toISOString().slice(0, 10),
            note: '',
          })
        }}
      />
    </div>
  )
}
