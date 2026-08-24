import { useCallback, useSyncExternalStore } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatAmount, isMoneyHidden, localeForLang, setMoneyHidden, subscribeHideMoney } from '@/shared/lib/format'

export function useHideMoney() {
  const hidden = useSyncExternalStore(subscribeHideMoney, isMoneyHidden, isMoneyHidden)
  const toggle = useCallback(() => {
    setMoneyHidden(!isMoneyHidden())
  }, [])
  return { hidden, toggle }
}

export function MoneyText({
  amount,
  lang,
  currency,
  ledger,
  prefix,
}: {
  amount: number
  lang: string
  currency?: string
  ledger?: boolean
  prefix?: string
}) {
  const { hidden } = useHideMoney()
  if (hidden) return <span>••••</span>
  const value = ledger && currency
    ? `${currency} ${new Intl.NumberFormat(localeForLang(lang), {
        numberingSystem: 'latn',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`
    : formatAmount(amount, lang, currency)
  return (
    <span className="font-nums">
      {prefix}
      {value}
    </span>
  )
}

export function HideMoneyButton() {
  const { t } = useTranslation()
  const { hidden, toggle } = useHideMoney()

  return (
    <button
      type="button"
      className="rounded-full p-2 text-ink hover:bg-navy hover:text-gold-bright"
      aria-label={hidden ? t('app.showMoney') : t('app.hideMoney')}
      onClick={toggle}
    >
      {hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
    </button>
  )
}
