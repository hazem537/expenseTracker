export const CURRENCIES = [
  'EGP',
  'USD',
  'EUR',
  'SAR',
  'AED',
  'GBP',
  'KWD',
  'JOD',
  'TRY',
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]

export const DEFAULT_CURRENCY: CurrencyCode = 'EGP'

export function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value)
}
