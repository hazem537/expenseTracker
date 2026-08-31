import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account, Transfer } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

interface TransferFormProps {
  accounts: Account[]
  transfer?: Transfer | null
  onSubmit: (input: {
    fromAccountId: string
    toAccountId: string
    fromAmount: number
    toAmount: number
    occurredOn: string
    note: string
  }) => Promise<void>
  onCancel: () => void
}

export function TransferForm({ accounts, transfer, onSubmit, onCancel }: TransferFormProps) {
  const { t } = useTranslation()
  const [fromId, setFromId] = useState(
    transfer?.from_account_id ?? accounts[0]?.id ?? '',
  )
  const [toId, setToId] = useState(
    transfer?.to_account_id ?? (accounts[1]?.id ?? ''),
  )
  const [fromAmount, setFromAmount] = useState(
    transfer ? String(transfer.from_amount) : '',
  )
  const [toAmount, setToAmount] = useState(
    transfer ? String(transfer.to_amount) : '',
  )
  const [occurredOn, setOccurredOn] = useState(
    transfer?.occurred_on ?? new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = useState(transfer?.note ?? '')
  const [rate, setRate] = useState<number | null>(transfer?.fx_rate ?? null)
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
    if (fromAccount.currency === toAccount.currency) {
      setRate(1)
      return
    }
    let cancelled = false
    setConverting(true)
    void fetchExchangeRate(fromAccount.currency, toAccount.currency, occurredOn)
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
  }, [fromAccount, toAccount, occurredOn])

  useEffect(() => {
    if (rate == null) return
    const send = Number(fromAmount)
    if (!Number.isFinite(send) || send <= 0) {
      if (!transfer) setToAmount('')
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
        occurredOn,
        note,
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
      <div className="space-y-1">
        <Label htmlFor="transfer-date">{t('expense.date')}</Label>
        <Input
          id="transfer-date"
          type="date"
          required
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="transfer-note">{t('expense.note')}</Label>
        <Input
          id="transfer-note"
          value={note}
          placeholder={t('expense.noteOptional')}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-xl">
          {transfer ? t('app.save') : t('accounts.transfer')}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 rounded-xl" onClick={onCancel}>
          {t('app.cancel')}
        </Button>
      </div>
    </form>
  )
}
