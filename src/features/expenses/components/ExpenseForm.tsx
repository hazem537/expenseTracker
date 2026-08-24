import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import { CATEGORIES, type Category } from '@/features/expenses/lib/categories'
import type { Expense, ExpenseInput } from '@/features/expenses/hooks/useExpenses'
import { CURRENCIES, type CurrencyCode } from '@/shared/lib/currencies'
import { useOnlineStatus } from '@/shared/lib/online'

interface ExpenseFormProps {
  initial?: Expense | null
  accounts: Account[]
  groups?: { id: string; name: string; currency?: string }[]
  lockGroupId?: string
  groupCurrency?: string
  defaultCurrency: CurrencyCode
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancel: () => void
  onBusyChange?: (busy: boolean) => void
}

const selectClass =
  'mt-1 flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60'

export function ExpenseForm({
  initial,
  accounts,
  groups = [],
  lockGroupId,
  groupCurrency,
  defaultCurrency,
  onSubmit,
  onCancel,
  onBusyChange,
}: ExpenseFormProps) {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? '')
  const account = accounts.find((item) => item.id === accountId)
  const [paidCurrency, setPaidCurrency] = useState<CurrencyCode>(
    account?.currency ?? defaultCurrency,
  )
  const [paidAmount, setPaidAmount] = useState(initial ? String(initial.amount) : '')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(
    initial ? initial.amount : null,
  )
  const [convertedBase, setConvertedBase] = useState<number | null>(
    initial ? initial.amount_base : null,
  )
  const [fxRate, setFxRate] = useState<number | null>(null)
  const [fxBusy, setFxBusy] = useState(false)
  const [fxError, setFxError] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>(initial?.category ?? 'food')
  const [occurredOn, setOccurredOn] = useState(
    initial?.occurred_on ?? new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [groupId, setGroupId] = useState(lockGroupId ?? initial?.group_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return
    if (!initial) setPaidCurrency(account.currency)
  }, [account?.id, account?.currency, initial])

  useEffect(() => {
    let cancelled = false
    async function convert() {
      const value = Number(paidAmount)
      if (!account || !Number.isFinite(value) || value <= 0) {
        setConvertedAmount(null)
        setConvertedBase(null)
        setFxRate(null)
        setFxError(null)
        return
      }

      // Same currency as account: amount is already in account units
      if (paidCurrency === account.currency) {
        let inBase = value
        if (account.currency !== defaultCurrency) {
          if (!online) {
            setConvertedAmount(value)
            setConvertedBase(value)
            setFxRate(1)
            setFxError(null)
            return
          }
          setFxBusy(true)
          setFxError(null)
          try {
            const rateToBase = await fetchExchangeRate(account.currency, defaultCurrency, occurredOn)
            inBase = convertAmount(value, rateToBase)
            if (!cancelled) {
              setConvertedAmount(value)
              setConvertedBase(inBase)
              setFxRate(1)
            }
          } catch {
            if (!cancelled) {
              setConvertedAmount(value)
              setConvertedBase(value)
              setFxRate(1)
              setFxError(null)
            }
          } finally {
            if (!cancelled) setFxBusy(false)
          }
          return
        }
        setConvertedAmount(value)
        setConvertedBase(value)
        setFxRate(1)
        setFxError(null)
        return
      }

      // Paid in another currency (e.g. EGP) → convert to account currency (e.g. USD) via API
      if (!online) {
        setConvertedAmount(null)
        setConvertedBase(null)
        setFxRate(null)
        setFxError(t('expense.fxOffline'))
        return
      }

      setFxBusy(true)
      setFxError(null)
      try {
        const rateToAccount = await fetchExchangeRate(paidCurrency, account.currency, occurredOn)
        const inAccount = convertAmount(value, rateToAccount)
        let inBase = inAccount
        if (account.currency !== defaultCurrency) {
          const rateToBase = await fetchExchangeRate(account.currency, defaultCurrency, occurredOn)
          inBase = convertAmount(inAccount, rateToBase)
        }
        if (!cancelled) {
          setConvertedAmount(inAccount)
          setConvertedBase(inBase)
          setFxRate(rateToAccount)
        }
      } catch {
        if (!cancelled) {
          setConvertedAmount(null)
          setConvertedBase(null)
          setFxRate(null)
          setFxError(t('expense.fxError'))
        }
      } finally {
        if (!cancelled) setFxBusy(false)
      }
    }
    void convert()
    return () => {
      cancelled = true
    }
  }, [paidAmount, paidCurrency, account, defaultCurrency, online, occurredOn, t])

  function setBusy(next: boolean) {
    setSaving(next)
    onBusyChange?.(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!accountId || convertedAmount == null || convertedBase == null || convertedAmount <= 0) {
      setError(fxError ?? t('expense.error'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const selectedGroupCurrency =
        groupCurrency ?? groups.find((group) => group.id === groupId)?.currency ?? null
      let amountGroup: number | null = null
      let groupFxRate: number | null = null
      if (groupId && selectedGroupCurrency && account) {
        if (account.currency === selectedGroupCurrency) {
          amountGroup = convertedAmount
          groupFxRate = 1
        } else {
          groupFxRate = await fetchExchangeRate(account.currency, selectedGroupCurrency, occurredOn)
          amountGroup = convertAmount(convertedAmount, groupFxRate)
        }
      }
      await onSubmit({
        account_id: accountId,
        amount: convertedAmount,
        amount_base: convertedBase,
        fx_rate: convertedAmount === 0 ? 1 : convertedBase / convertedAmount,
        amount_group: amountGroup,
        group_fx_rate: groupFxRate,
        category,
        occurred_on: occurredOn,
        note,
        group_id: groupId || null,
      })
      setBusy(false)
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Insufficient funds'
          ? t('accounts.insufficient')
          : t('expense.error'),
      )
      setBusy(false)
    }
  }

  if (accounts.length === 0) {
    return <p className="text-neutral-600">{t('accounts.needAccountFirst')}</p>
  }

  const needsFx = Boolean(account && paidCurrency !== account.currency)

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="account">{t('expense.account')}</Label>
        <select
          id="account"
          className={selectClass}
          value={accountId}
          disabled={saving}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.currency})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="paid-currency">{t('expense.paidCurrency')}</Label>
          <select
            id="paid-currency"
            className={selectClass}
            value={paidCurrency}
            disabled={saving}
            onChange={(e) => setPaidCurrency(e.target.value as CurrencyCode)}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">{t('expense.paidAmount')}</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            disabled={saving}
            className="font-nums"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder={needsFx ? t('expense.paidAmountHint') : undefined}
          />
        </div>
      </div>
      {needsFx ? (
        <p className="text-xs text-muted">{t('expense.fxHelp', { currency: account?.currency })}</p>
      ) : null}
      {account && (needsFx || (convertedAmount != null && paidAmount)) ? (
        <div className="rounded-xl border border-gold-soft/70 bg-gold-soft/20 px-3 py-2 text-sm text-heading">
          {fxBusy ? (
            <p>{t('expense.fxLoading')}</p>
          ) : fxError ? (
            <p className="text-red-600">{fxError}</p>
          ) : convertedAmount != null ? (
            <div className="space-y-1">
              <p className="font-medium">
                {t('expense.fxEqualsAccount', {
                  amount: convertedAmount.toFixed(2),
                  currency: account.currency,
                })}
              </p>
              {needsFx && fxRate != null ? (
                <p className="text-xs text-muted">
                  {t('expense.fxRateLine', {
                    from: paidCurrency,
                    to: account.currency,
                    rate: fxRate.toFixed(6),
                  })}
                </p>
              ) : null}
              {account.currency !== defaultCurrency && convertedBase != null ? (
                <p className="text-xs text-muted">
                  {t('expense.fxEqualsBase', {
                    amount: convertedBase.toFixed(2),
                    currency: defaultCurrency,
                  })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {lockGroupId ? null : (
        <div className="space-y-1">
          <Label htmlFor="expense-group">{t('expense.group')}</Label>
          <select
            id="expense-group"
            className={selectClass}
            value={groupId}
            disabled={saving}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">{t('expense.groupNone')}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="category">{t('expense.category')}</Label>
        <select
          id="category"
          className={selectClass}
          value={category}
          disabled={saving}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {t(`categories.${key}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="date">{t('expense.date')}</Label>
        <Input
          id="date"
          type="date"
          required
          disabled={saving}
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">
          {t('expense.note')}{' '}
          <span className="font-normal text-neutral-400">({t('expense.noteOptional')})</span>
        </Label>
        <Input
          id="note"
          type="text"
          disabled={saving}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={saving || fxBusy || convertedAmount == null}
          className="min-h-11 flex-1 rounded-xl"
        >
          {saving ? t('app.loading') : t('app.save')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 rounded-xl"
          disabled={saving}
          onClick={onCancel}
        >
          {t('app.cancel')}
        </Button>
      </div>
    </form>
  )
}
