import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountDetailView } from '@/features/accounts/components/AccountDetailPage'
import { AccountFormDialog } from '@/features/accounts/components/AccountFormDialog'
import { AccountList } from '@/features/accounts/components/AccountList'
import { AccountsHeader } from '@/features/accounts/components/AccountsHeader'
import { AddMoneyDialog } from '@/features/accounts/components/AddMoneyDialog'
import { JoinSharedDialog } from '@/features/accounts/components/JoinSharedDialog'
import { RecentTransfers } from '@/features/accounts/components/RecentTransfers'
import { ShareAccountDialog } from '@/features/accounts/components/ShareAccountDialog'
import { TransferDialog } from '@/features/accounts/components/TransferDialog'
import { useAccounts, type Account } from '@/features/accounts/hooks/useAccounts'
import { accountBalanceWeights, useFxRates } from '@/features/accounts/hooks/useFxRates'
import { useProfile } from '@/features/settings'
import { DEFAULT_CURRENCY } from '@/shared/lib/currencies'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SectionTabs } from '@/shared/ui/SectionTabs'
import { SetupNotice } from '@/shared/ui/SetupNotice'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

export function AccountsPage() {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const { profile } = useProfile()
  const {
    accounts,
    transfers,
    loading,
    error,
    currentUserId,
    membersByAccount,
    createAccount,
    addMoney,
    updateAccount,
    deleteAccount,
    transfer,
    enableSharing,
    regenerateShareCode,
    disableSharing,
    joinByShareCode,
    leaveSharedAccount,
    setHideOnDashboard,
  } = useAccounts()
  const lang = i18n.language
  const defaultCurrency = profile?.default_currency ?? DEFAULT_CURRENCY

  const [createOpen, setCreateOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [depositAccount, setDepositAccount] = useState<Account | null>(null)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [shareAccount, setShareAccount] = useState<Account | null>(null)
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<Account | null>(null)
  const [activityAccountId, setActivityAccountId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [hubTab, setHubTab] = useState<'accounts' | 'transfers'>('accounts')

  const usedCurrencies = useMemo(() => {
    return Array.from(new Set(accounts.map((item) => item.currency))).sort()
  }, [accounts])

  const visibleAccounts = useMemo(() => {
    if (!currencyFilter) return accounts
    return accounts.filter((item) => item.currency === currencyFilter)
  }, [accounts, currencyFilter])

  const memberCounts = useMemo(() => {
    const next: Record<string, number> = {}
    for (const account of accounts) {
      next[account.id] = membersByAccount[account.id]?.length ?? 1
    }
    return next
  }, [accounts, membersByAccount])

  const shareAccountLive = shareAccount
    ? (accounts.find((a) => a.id === shareAccount.id) ?? shareAccount)
    : null

  const needsFx = usedCurrencies.some((code) => code !== defaultCurrency)
  const { data: rates } = useFxRates(usedCurrencies, defaultCurrency, online && needsFx)
  const weights = useMemo(
    () => accountBalanceWeights(accounts, defaultCurrency, rates),
    [accounts, defaultCurrency, rates],
  )

  if (activityAccountId) {
    return (
      <div className="space-y-6">
        {!isSupabaseConfigured ? <SetupNotice /> : null}
        <AccountDetailView
          accountId={activityAccountId}
          onBack={() => setActivityAccountId(null)}
          onUpdateAccount={async (input) => {
            await updateAccount(activityAccountId, input)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <AccountsHeader
        canTransfer={accounts.length >= 2}
        actionsDisabled={!online}
        onAddAccount={() => setCreateOpen(true)}
        onTransfer={() => setTransferOpen(true)}
        onJoin={() => setJoinOpen(true)}
      />
      <SectionTabs
        value={hubTab}
        onChange={setHubTab}
        items={[
          { id: 'accounts', label: t('accounts.tabAccounts') },
          { id: 'transfers', label: t('accounts.tabTransfers') },
        ]}
      />
      {actionError ? <p className="text-red-600">{actionError}</p> : null}
      {hubTab === 'accounts' ? (
        <div className="space-y-6">
      {usedCurrencies.length > 1 ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-heading" htmlFor="account-currency-filter">
            {t('accounts.filterCurrency')}
          </label>
          <select
            id="account-currency-filter"
            className="min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base sm:max-w-xs"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
          >
            <option value="">{t('accounts.filterAllCurrencies')}</option>
            {usedCurrencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {loading ? <p>{t('app.loading')}</p> : null}
      {error && online ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {!loading && accounts.length > 0 && visibleAccounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.filterEmpty')}
        </p>
      ) : null}
      <AccountList
        accounts={visibleAccounts}
        lang={lang}
        loading={loading}
        weights={weights}
        memberCounts={memberCounts}
        currentUserId={currentUserId}
        actionsDisabled={!online}
        onAddMoney={setDepositAccount}
        onEdit={setEditAccount}
        onDelete={setDeleteAccountTarget}
        onShare={setShareAccount}
        onViewActivity={(account) => setActivityAccountId(account.id)}
        onToggleDashboard={(account) => {
          void setHideOnDashboard(account.id, !account.hide_on_dashboard)
        }}
        hideEmpty={Boolean(currencyFilter)}
      />
        </div>
      ) : (
        <RecentTransfers transfers={transfers} accounts={accounts} lang={lang} />
      )}
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
      <JoinSharedDialog
        open={joinOpen}
        actionsDisabled={!online}
        onOpenChange={setJoinOpen}
        onSubmit={async (code) => {
          await joinByShareCode(code)
        }}
      />
      <ShareAccountDialog
        account={shareAccountLive}
        members={shareAccountLive ? (membersByAccount[shareAccountLive.id] ?? []) : []}
        currentUserId={currentUserId}
        open={shareAccount != null}
        actionsDisabled={!online}
        onOpenChange={(open) => {
          if (!open) setShareAccount(null)
        }}
        onEnable={enableSharing}
        onRegenerate={regenerateShareCode}
        onDisable={disableSharing}
        onLeave={leaveSharedAccount}
      />
      <ConfirmDialog
        open={deleteAccountTarget != null}
        description={t('accounts.confirmDelete')}
        onOpenChange={(open) => {
          if (!open) setDeleteAccountTarget(null)
        }}
        onConfirm={async () => {
          if (!deleteAccountTarget) return
          setActionError(null)
          try {
            await deleteAccount(deleteAccountTarget.id)
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : ''
            setActionError(message === 'HAS_EXPENSES' ? t('accounts.cannotDelete') : t('expense.error'))
          }
        }}
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
