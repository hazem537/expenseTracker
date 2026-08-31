import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Account, Transfer } from '@/features/accounts/hooks/useAccounts'
import { formatDate } from '@/shared/lib/format'
import { ExpandableRecord } from '@/shared/ui/ExpandableRecord'
import { MoneyText } from '@/shared/ui/HideMoney'

interface RecentTransfersProps {
  transfers: Transfer[]
  accounts: Account[]
  lang: string
  actionsDisabled?: boolean
  onEdit?: (transfer: Transfer) => void
  onDelete?: (transfer: Transfer) => void
}

export function RecentTransfers({
  transfers,
  accounts,
  lang,
  actionsDisabled = false,
  onEdit,
  onDelete,
}: RecentTransfersProps) {
  const { t } = useTranslation()
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transfers.filter((item) => {
      if (fromId && item.from_account_id !== fromId) return false
      if (toId && item.to_account_id !== toId) return false
      return true
    })
  }, [transfers, fromId, toId])

  return (
    <section className="space-y-3">
      <div className="grid gap-3 rounded-2xl border border-gold-soft/70 bg-surface p-3 sm:grid-cols-2 sm:p-4">
        <div>
          <label className="block text-xs font-medium text-muted" htmlFor="transfer-filter-from">
            {t('accounts.filterFrom')}
          </label>
          <select
            id="transfer-filter-from"
            className="mt-1 min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
          >
            <option value="">{t('accounts.filterAllAccounts')}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted" htmlFor="transfer-filter-to">
            {t('accounts.filterTo')}
          </label>
          <select
            id="transfer-filter-to"
            className="mt-1 min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            <option value="">{t('accounts.filterAllAccounts')}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {transfers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.transfersEmpty')}
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.filterTransfersEmpty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const from = accounts.find((a) => a.id === item.from_account_id)
            const to = accounts.find((a) => a.id === item.to_account_id)
            return (
              <ExpandableRecord
                key={item.id}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                summary={
                  <p className="truncate text-sm font-medium text-heading">
                    {from?.name ?? '—'} → {to?.name ?? '—'}
                  </p>
                }
                value={
                  <p className="text-sm font-semibold">
                    <MoneyText amount={item.from_amount} lang={lang} currency={from?.currency} />
                  </p>
                }
              >
                <p className="text-sm text-muted">{formatDate(item.occurred_on, lang)}</p>
                <p className="text-sm text-muted">
                  <MoneyText amount={item.from_amount} lang={lang} currency={from?.currency} /> →{' '}
                  <MoneyText amount={item.to_amount} lang={lang} currency={to?.currency} />
                </p>
                {item.note ? <p className="text-sm text-muted">{item.note}</p> : null}
                <div className="flex justify-end gap-1 pt-1">
                  {onEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10"
                      aria-label={actionsDisabled ? t('offline.actionDisabled') : t('app.edit')}
                      disabled={actionsDisabled}
                      title={actionsDisabled ? t('offline.actionDisabled') : undefined}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil />
                    </Button>
                  ) : null}
                  {onDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 text-red-700 hover:text-red-800"
                      aria-label={actionsDisabled ? t('offline.actionDisabled') : t('app.delete')}
                      disabled={actionsDisabled}
                      title={actionsDisabled ? t('offline.actionDisabled') : undefined}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </ExpandableRecord>
            )
          })}
        </ul>
      )}
    </section>
  )
}
