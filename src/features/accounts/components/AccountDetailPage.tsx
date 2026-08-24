import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, BarChart3, LayoutList, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccountDetail, type MemberTotals } from '@/features/accounts/hooks/useAccountDetail'
import { CATEGORY_COLORS } from '@/features/expenses/lib/categories'
import { CURRENCIES, type CurrencyCode } from '@/shared/lib/currencies'
import { formatDate } from '@/shared/lib/format'
import { useOnlineStatus } from '@/shared/lib/online'
import { MoneyText } from '@/shared/ui/HideMoney'

const MEMBER_COLORS = [
  '#1a2740',
  '#c9a227',
  '#1b7a52',
  '#8b5e3c',
  '#b8860b',
  '#3d5a45',
  '#6d4c2b',
  '#4a6fa5',
]

interface AccountDetailViewProps {
  accountId: string
  onBack: () => void
  onUpdateAccount: (input: {
    name: string
    currency: CurrencyCode
    balance: number
  }) => Promise<void>
}

function PersonCharts({
  memberTotals,
  currency,
  lang,
}: {
  memberTotals: MemberTotals[]
  currency: string
  lang: string
}) {
  const { t } = useTranslation()
  const incomeRows = memberTotals.filter((row) => row.totalIn > 0)
  const outcomeRows = memberTotals.filter((row) => row.totalOut > 0)
  const incomeTotal = incomeRows.reduce((sum, row) => sum + row.totalIn, 0)
  const outcomeTotal = outcomeRows.reduce((sum, row) => sum + row.totalOut, 0)

  function donut(rows: MemberTotals[], total: number, field: 'totalIn' | 'totalOut') {
    if (total <= 0) return 'var(--gold-soft)'
    let start = 0
    const stops = rows.map((row, index) => {
      const value = row[field]
      const end = start + (value / total) * 360
      const color = MEMBER_COLORS[index % MEMBER_COLORS.length]
      const slice = `${color} ${start}deg ${end}deg`
      start = end
      return slice
    })
    return `conic-gradient(${stops.join(', ')})`
  }

  function legend(rows: MemberTotals[], field: 'totalIn' | 'totalOut') {
    return (
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map((row, index) => (
          <li key={row.user_id} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: MEMBER_COLORS[index % MEMBER_COLORS.length] }}
                aria-hidden
              />
              <span className="truncate">{row.label}</span>
            </span>
            <MoneyText amount={row[field]} lang={lang} currency={currency} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-gold-soft/70 bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          {t('accounts.chartIncome')}
        </p>
        {incomeTotal <= 0 ? (
          <p className="text-sm text-muted">{t('accounts.chartEmpty')}</p>
        ) : (
          <>
            <div
              className="mx-auto size-36 rounded-full"
              style={{
                background: donut(incomeRows, incomeTotal, 'totalIn'),
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17.5px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17.5px))',
              }}
              role="img"
              aria-label={t('accounts.chartIncome')}
            />
            {legend(incomeRows, 'totalIn')}
          </>
        )}
      </div>
      <div className="rounded-2xl border border-gold-soft/70 bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-red-800 dark:text-red-200">
          {t('accounts.chartOutcome')}
        </p>
        {outcomeTotal <= 0 ? (
          <p className="text-sm text-muted">{t('accounts.chartEmpty')}</p>
        ) : (
          <>
            <div
              className="mx-auto size-36 rounded-full"
              style={{
                background: donut(outcomeRows, outcomeTotal, 'totalOut'),
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17.5px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17.5px))',
              }}
              role="img"
              aria-label={t('accounts.chartOutcome')}
            />
            {legend(outcomeRows, 'totalOut')}
          </>
        )}
      </div>
    </div>
  )
}

function PersonStrip({
  memberTotals,
  currency,
  lang,
  currentUserId,
}: {
  memberTotals: MemberTotals[]
  currency: string
  lang: string
  currentUserId: string | null
}) {
  const { t } = useTranslation()
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex w-max min-w-full gap-3">
        {memberTotals.map((row) => (
          <li
            key={row.user_id}
            className="w-[7.5rem] shrink-0 rounded-2xl border border-gold-soft/70 bg-surface p-3 text-center shadow-[0_8px_20px_rgba(201,162,39,0.06)]"
          >
            <p className="truncate text-sm font-semibold text-heading" title={row.label}>
              {row.label}
              {row.user_id === currentUserId ? (
                <span className="block text-[10px] font-normal text-muted">({t('accounts.you')})</span>
              ) : null}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              +
              <MoneyText amount={row.totalIn} lang={lang} currency={currency} />
            </p>
            <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-300">
              −
              <MoneyText amount={row.totalOut} lang={lang} currency={currency} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AccountDetailView({ accountId, onBack, onUpdateAccount }: AccountDetailViewProps) {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const lang = i18n.language
  const {
    account,
    expenses,
    deposits,
    memberTotals,
    memberLabels,
    currentUserId,
    loading,
    error,
    reload,
  } = useAccountDetail(accountId)

  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [headerBusy, setHeaderBusy] = useState(false)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [memberView, setMemberView] = useState<'list' | 'charts'>('list')

  useEffect(() => {
    if (!account) return
    setName(account.name)
    setBalance(String(account.balance))
    setCurrency(account.currency)
  }, [account])

  const showMembers = memberTotals.length > 1 || Boolean(account?.share_code)
  const showNeedCache = !online && !loading && !account && !error
  const canEditHeader = Boolean(account)

  const headerDirty = useMemo(() => {
    if (!account) return false
    return (
      name.trim() !== account.name ||
      Number(balance) !== account.balance ||
      currency !== account.currency
    )
  }, [account, name, balance, currency])

  function personName(userId: string) {
    return (
      memberLabels[userId] ??
      (userId === currentUserId ? t('accounts.you') : t('accounts.memberFallback'))
    )
  }

  async function handleSaveHeader(event: FormEvent) {
    event.preventDefault()
    if (!account || !canEditHeader) return
    const nextBalance = Number(balance)
    if (!name.trim() || !Number.isFinite(nextBalance)) {
      setHeaderError(t('expense.error'))
      return
    }
    setHeaderBusy(true)
    setHeaderError(null)
    try {
      await onUpdateAccount({
        name: name.trim(),
        currency,
        balance: nextBalance,
      })
      await reload()
    } catch {
      setHeaderError(t('expense.error'))
    } finally {
      setHeaderBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onBack}>
          <ArrowLeft />
          {t('accounts.backToList')}
        </Button>
      </div>

      {loading ? <p className="text-sm text-muted">{t('app.loading')}</p> : null}
      {error && online ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {showNeedCache ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('offline.needCache')}
        </p>
      ) : null}
      {!loading && !account && !showNeedCache ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.detailNotFound')}
        </p>
      ) : null}

      {account ? (
        <>
          <header className="rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
            <form className="space-y-2" onSubmit={(e) => void handleSaveHeader(e)}>
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                <input
                  className="min-w-[6.5rem] flex-1 rounded-xl border border-gold-soft bg-surface px-3 py-2 text-base font-semibold text-heading"
                  value={name}
                  disabled={headerBusy || !online}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={t('accounts.name')}
                  placeholder={t('accounts.name')}
                />
                <input
                  className="w-[7rem] shrink-0 rounded-xl border border-gold-soft bg-surface px-3 py-2 text-base font-semibold tabular-nums"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={balance}
                  disabled={headerBusy || !online}
                  onChange={(e) => setBalance(e.target.value)}
                  aria-label={t('accounts.balance')}
                />
                <select
                  className="w-[5.25rem] shrink-0 rounded-xl border border-gold-soft bg-surface px-2 py-2 text-sm font-medium"
                  value={currency}
                  disabled={headerBusy || !online}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  aria-label={t('accounts.currency')}
                >
                  {CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0 rounded-xl"
                  disabled={headerBusy || !online || !headerDirty}
                  title={!online ? t('offline.actionDisabled') : undefined}
                >
                  <Pencil className="size-3.5" />
                  {t('app.save')}
                </Button>
                {showMembers ? (
                  <span className="shrink-0 rounded-full bg-gold-soft/50 px-2 py-0.5 text-xs font-medium text-heading">
                    {t('accounts.sharedBadge')}
                  </span>
                ) : null}
              </div>
              {headerError ? <p className="text-sm text-red-600">{headerError}</p> : null}
            </form>
          </header>

          {showMembers ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-heading">{t('accounts.memberTotals')}</h3>
                <div className="flex rounded-xl border border-gold-soft/70 p-0.5">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      memberView === 'list' ? 'bg-navy text-gold-bright' : 'text-muted'
                    }`}
                    onClick={() => setMemberView('list')}
                  >
                    <LayoutList className="size-3.5" />
                    {t('accounts.viewList')}
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      memberView === 'charts' ? 'bg-navy text-gold-bright' : 'text-muted'
                    }`}
                    onClick={() => setMemberView('charts')}
                  >
                    <BarChart3 className="size-3.5" />
                    {t('accounts.viewCharts')}
                  </button>
                </div>
              </div>
              {memberView === 'list' ? (
                <PersonStrip
                  memberTotals={memberTotals}
                  currency={account.currency}
                  lang={lang}
                  currentUserId={currentUserId}
                />
              ) : (
                <PersonCharts
                  memberTotals={memberTotals}
                  currency={account.currency}
                  lang={lang}
                />
              )}
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-heading">{t('accounts.detailExpenses')}</h3>
            {expenses.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
                {t('expense.empty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {expenses.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]"
                  >
                    <p className="font-semibold">
                      <MoneyText amount={item.amount} lang={lang} currency={account.currency} />
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ background: CATEGORY_COLORS[item.category] }}
                        aria-hidden
                      />
                      {t(`categories.${item.category}`)}
                      <span aria-hidden>·</span>
                      {formatDate(item.occurred_on, lang)}
                      <span aria-hidden>·</span>
                      {t('expense.addedBy', { name: personName(item.user_id) })}
                    </p>
                    {item.note ? <p className="mt-1 text-sm text-muted">{item.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-heading">{t('accounts.detailDeposits')}</h3>
            {deposits.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
                {t('accounts.noDeposits')}
              </p>
            ) : (
              <ul className="space-y-2">
                {deposits.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]"
                  >
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                      +
                      <MoneyText amount={item.amount} lang={lang} currency={account.currency} />
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      {formatDate(item.occurred_on, lang)}
                      <span aria-hidden>·</span>
                      {t('expense.addedBy', { name: personName(item.user_id) })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

export function AccountDetailPage(props: AccountDetailViewProps) {
  return <AccountDetailView {...props} />
}
