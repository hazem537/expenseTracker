import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type {
  PersonSettlementBalance,
  ReceiveSettlementInput,
} from '@/features/expenseGroups/hooks/useExpenseGroupDetail'
import { SETTLEMENT_EPSILON } from '@/features/expenseGroups/hooks/useExpenseGroupDetail'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { MoneyText } from '@/shared/ui/HideMoney'

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

interface ReceiveSettlementDialogProps {
  open: boolean
  groupId: string
  groupCurrency: CurrencyCode
  myOwed: number
  personBalances: PersonSettlementBalance[]
  currentUserId: string
  accounts: Account[]
  lang: string
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: ReceiveSettlementInput) => Promise<void>
}

export function ReceiveSettlementDialog({
  open,
  groupId,
  groupCurrency,
  myOwed,
  personBalances,
  currentUserId,
  accounts,
  lang,
  actionsDisabled = false,
  onOpenChange,
  onSubmit,
}: ReceiveSettlementDialogProps) {
  const { t } = useTranslation()
  const debtors = useMemo(
    () =>
      personBalances.filter(
        (row) => row.user_id !== currentUserId && row.owedToThem < -SETTLEMENT_EPSILON,
      ),
    [personBalances, currentUserId],
  )

  const [fromUserId, setFromUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [accountAmount, setAccountAmount] = useState<number | null>(null)
  const [fxRate, setFxRate] = useState(1)
  const [fxBusy, setFxBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const account = accounts.find((item) => item.id === accountId) ?? null
  const selectedDebtor = debtors.find((row) => row.user_id === fromUserId) ?? null
  const maxFromDebtor = selectedDebtor ? Math.abs(selectedDebtor.owedToThem) : 0
  const maxAmount = Math.min(myOwed, maxFromDebtor || myOwed)

  useEffect(() => {
    if (!open) return
    const first = debtors[0]
    setFromUserId(first?.user_id ?? '')
    const defaultAmt = first
      ? Math.min(myOwed, Math.abs(first.owedToThem))
      : myOwed
    setAmount(defaultAmt > 0 ? defaultAmt.toFixed(2) : '')
    setAccountId(accounts[0]?.id ?? '')
    setError(null)
    setBusy(false)
  }, [open, debtors, myOwed, accounts])

  useEffect(() => {
    if (!selectedDebtor) return
    const cap = Math.min(myOwed, Math.abs(selectedDebtor.owedToThem))
    setAmount(cap > 0 ? cap.toFixed(2) : '')
  }, [fromUserId, selectedDebtor, myOwed])

  useEffect(() => {
    let cancelled = false
    async function convert() {
      const value = Number(amount)
      if (!account || !(value > 0)) {
        setAccountAmount(null)
        setFxRate(1)
        return
      }
      if (account.currency === groupCurrency) {
        setAccountAmount(value)
        setFxRate(1)
        return
      }
      setFxBusy(true)
      try {
        const rate = await fetchExchangeRate(groupCurrency, account.currency, today)
        if (cancelled) return
        setFxRate(rate)
        setAccountAmount(convertAmount(value, rate))
      } catch {
        if (!cancelled) {
          setAccountAmount(null)
          setError(t('expense.error'))
        }
      } finally {
        if (!cancelled) setFxBusy(false)
      }
    }
    void convert()
    return () => {
      cancelled = true
    }
  }, [amount, account, groupCurrency, today, t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy || actionsDisabled || fxBusy) return
    const value = Number(amount)
    if (!fromUserId || !accountId || !(value > 0) || accountAmount == null || accountAmount <= 0) {
      setError(t('expense.error'))
      return
    }
    if (value > maxAmount + SETTLEMENT_EPSILON) {
      setError(t('expenseGroups.receiveAmountTooHigh'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        groupId,
        fromUserId,
        amount: value,
        accountId,
        accountAmount,
        fxRate,
        occurredOn: today,
      })
      onOpenChange(false)
    } catch {
      setError(t('expense.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenseGroups.receiveMoney')}</DialogTitle>
          <DialogDescription>{t('expenseGroups.receiveMoneyHint')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <p className="text-sm text-muted">
            {t('expenseGroups.youShouldReceive')}{' '}
            <span className="font-semibold text-heading">
              <MoneyText amount={myOwed} lang={lang} currency={groupCurrency} />
            </span>
          </p>
          <div className="space-y-1">
            <Label htmlFor="receive-from">{t('expenseGroups.receiveFrom')}</Label>
            <select
              id="receive-from"
              className={selectClass}
              value={fromUserId}
              disabled={busy || actionsDisabled || debtors.length === 0}
              onChange={(e) => setFromUserId(e.target.value)}
            >
              {debtors.length === 0 ? (
                <option value="">{t('expenseGroups.noDebtors')}</option>
              ) : (
                debtors.map((row) => (
                  <option key={row.user_id} value={row.user_id}>
                    {row.label} (
                    {t('expenseGroups.owesAmount', {
                      amount: Math.abs(row.owedToThem).toFixed(2),
                      currency: groupCurrency,
                    })}
                    )
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="receive-amount">{t('expense.amount')}</Label>
            <Input
              id="receive-amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              disabled={busy || actionsDisabled}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted">
              {t('expenseGroups.receiveMax', {
                amount: maxAmount.toFixed(2),
                currency: groupCurrency,
              })}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="receive-account">{t('expenseGroups.receiveIntoAccount')}</Label>
            <select
              id="receive-account"
              className={selectClass}
              value={accountId}
              disabled={busy || actionsDisabled || accounts.length === 0}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.length === 0 ? (
                <option value="">{t('accounts.needAccountFirst')}</option>
              ) : (
                accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currency})
                  </option>
                ))
              )}
            </select>
          </div>
          {account && account.currency !== groupCurrency && accountAmount != null ? (
            <p className="text-sm text-muted">
              {t('expenseGroups.receiveConverted', {
                amount: accountAmount.toFixed(2),
                currency: account.currency,
              })}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {t('app.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={
                busy ||
                fxBusy ||
                actionsDisabled ||
                !fromUserId ||
                !accountId ||
                accountAmount == null ||
                accounts.length === 0
              }
            >
              {busy || fxBusy ? t('app.loading') : t('app.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
