import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { MoneyText } from '@/shared/ui/HideMoney'

interface AccountListItemProps {
  account: Account
  lang: string
  weight: number | null
  onAddMoney: (account: Account) => void
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountListItem({
  account,
  lang,
  weight,
  onAddMoney,
  onEdit,
  onDelete,
}: AccountListItemProps) {
  const { t } = useTranslation()

  return (
    <li className="space-y-3 rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{account.name}</p>
          <p className="text-sm text-muted">{account.currency}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 text-red-700"
          aria-label={t('app.delete')}
          onClick={() => onDelete(account)}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('accounts.weight')}</p>
          <p className="font-semibold">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('accounts.balance')}</p>
          <p className="text-sm font-semibold">
            <MoneyText amount={account.balance} lang={lang} currency={account.currency} />
          </p>
        </div>
      </div>
      {weight != null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-gold-soft/40">
          <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(weight, 100)}%` }} />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" onClick={() => onAddMoney(account)}>
          <Plus />
          {t('accounts.addMoney')}
        </Button>
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" onClick={() => onEdit(account)}>
          <Pencil />
          {t('app.edit')}
        </Button>
      </div>
    </li>
  )
}
