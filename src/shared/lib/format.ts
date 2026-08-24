const HIDDEN_MONEY = '••••'
const HIDE_MONEY_KEY = 'expense-tracker-hide-money'

function readHideMoney() {
  try {
    return localStorage.getItem(HIDE_MONEY_KEY) === '1'
  } catch {
    return false
  }
}

let moneyHidden = readHideMoney()
const hideMoneyListeners = new Set<() => void>()

export function isMoneyHidden() {
  return moneyHidden
}

export function subscribeHideMoney(onStoreChange: () => void) {
  hideMoneyListeners.add(onStoreChange)
  return () => {
    hideMoneyListeners.delete(onStoreChange)
  }
}

export function setMoneyHidden(next: boolean) {
  moneyHidden = next
  try {
    localStorage.setItem(HIDE_MONEY_KEY, next ? '1' : '0')
  } catch {
    /* ignore */
  }
  hideMoneyListeners.forEach((listener) => listener())
}

export function localeForLang(lang: string) {
  return lang.startsWith('ar') ? 'ar-EG' : 'en-US'
}

const LATIN_DIGITS = { numberingSystem: 'latn' as const }

export function formatAmount(amount: number, lang: string, currency?: string) {
  if (isMoneyHidden()) return HIDDEN_MONEY
  if (currency) {
    return new Intl.NumberFormat(localeForLang(lang), {
      style: 'currency',
      currency,
      numberingSystem: LATIN_DIGITS.numberingSystem,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }
  return new Intl.NumberFormat(localeForLang(lang), {
    style: 'decimal',
    numberingSystem: LATIN_DIGITS.numberingSystem,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(isoDate: string, lang: string) {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    numberingSystem: LATIN_DIGITS.numberingSystem,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

export function formatMonthLabel(year: number, monthIndex: number, lang: string) {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    numberingSystem: LATIN_DIGITS.numberingSystem,
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1))
}

export function toIsoDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function monthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start: toIsoDate(start), end: toIsoDate(end), year, month }
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const next = new Date(year, monthIndex + delta, 1)
  return monthRange(next)
}

export function eachIsoDay(start: string, end: string) {
  const days: string[] = []
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || cursor > last) return days
  while (cursor <= last) {
    days.push(toIsoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}
