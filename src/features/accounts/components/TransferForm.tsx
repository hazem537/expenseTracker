import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

interface TransferFormProps {
  accounts: Account[]
  onSubmit: (input: {
    fromAccountId: string
    toAccountId: string
    fromAmount: number
    toAmount: number
  }) => Promise<void>
  onCancel: () => void
}

export function TransferForm({ accounts, onSubmit, onCancel }: TransferFormProps) {
  const { t } = useTranslation()
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '')
  const [toId, setToId] = useState(accounts[1]?.id ?? '')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [rate, setRate] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fromAccount = accounts.find((item) => item.id === fromId)
  const toAccount = accounts.find((item) => item.id === toId)
  const needsFx = Boolean(
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency,
  )

  useEffect(() => {
    if (!fromAccount || !toAccount) return
    let cancelled = false
    setConverting(true)
    void fetchExchangeRate(fromAccount.currency, toAccount.currency)
      .then((nextRate) => {
        if (!cancelled) setRate(nextRate)
      })
      .catch(() => {
        if (!cancelled) setRate(null)
      })
      .finally(() => {
        if (!cancelled) setConverting(false)
      })
    return () => {
      cancelled = true
    }
  }, [fromAccount, toAccount])

  useEffect(() => {
    if (rate == null) return
    const send = Number(fromAmount)
    if (!Number.isFinite(send) || send <= 0) {
      setToAmount('')
      return
    }
    setToAmount(String(convertAmount(send, rate)))
  }, [fromAmount, rate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const fromValue = Number(fromAmount)
    const toValue = needsFx ? Number(toAmount) : fromValue
    if (
      !fromId ||
      !toId ||
      fromId === toId ||
      !Number.isFinite(fromValue) ||
      fromValue <= 0 ||
      !Number.isFinite(toValue) ||
      toValue <= 0
    ) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        fromAccountId: fromId,
        toAccountId: toId,
        fromAmount: fromValue,
        toAmount: toValue,
      })
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Insufficient funds'
          ? t('accounts.insufficient')
          : t('expense.error'),
      )
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="transfer-from">{t('accounts.from')}</Label>
        <select
          id="transfer-from"
          className={selectClass}
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          required
        >
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.currency})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="transfer-to">{t('accounts.to')}</Label>
        <select
          id="transfer-to"
          className={selectClass}
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          required
        >
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.currency})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="transfer-send">
          {t('accounts.sendAmount')} {fromAccount ? `(${fromAccount.currency})` : ''}
        </Label>
        <Input
          id="transfer-send"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
        />
      </div>
      {needsFx ? (
        <div className="space-y-1">
          <Label htmlFor="transfer-receive">
            {t('accounts.receiveAmount')} {toAccount ? `(${toAccount.currency})` : ''}
          </Label>
          <Input
            id="transfer-receive"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
          />
          {converting ? (
            <p className="text-xs text-neutral-500">{t('accounts.converting')}</p>
          ) : rate && fromAccount && toAccount ? (
            <p className="text-xs text-neutral-500">
              {t('accounts.rateLabel', {
                from: fromAccount.currency,
                to: toAccount.currency,
                rate,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-xl">
          {t('accounts.transfer')}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 rounded-xl" onClick={onCancel}>
          {t('app.cancel')}
        </Button>
      </div>
    </form>
  )
}
