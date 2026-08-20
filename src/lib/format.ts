export function localeForLang(lang: string) {
  return lang.startsWith('ar') ? 'ar-EG' : 'en-US'
}

export function formatAmount(amount: number, lang: string) {
  return new Intl.NumberFormat(localeForLang(lang), {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(isoDate: string, lang: string) {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

export function formatMonthLabel(year: number, monthIndex: number, lang: string) {
  return new Intl.DateTimeFormat(localeForLang(lang), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1))
}

export function monthRange(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { start: toIso(start), end: toIso(end), year, month }
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}
