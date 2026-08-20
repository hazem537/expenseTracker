export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  const response = await fetch(`https://open.er-api.com/v6/latest/${from}`)
  if (!response.ok) throw new Error('FX request failed')
  const data = (await response.json()) as { result?: string; rates?: Record<string, number> }
  const rate = data.rates?.[to]
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('FX rate missing')
  }
  return rate
}

export function convertAmount(amount: number, rate: number) {
  return Math.round(amount * rate * 100) / 100
}
