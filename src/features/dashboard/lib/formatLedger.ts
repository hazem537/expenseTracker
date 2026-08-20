import { localeForLang, isMoneyHidden } from '@/shared/lib/format'

export function formatLedger(amount: number, currency: string, lang: string) {
  if (isMoneyHidden()) return '••••'
  const value = new Intl.NumberFormat(localeForLang(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${currency} ${value}`
}
