function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function shiftIsoDate(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function fetchLatestRate(from: string, to: string): Promise<number> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${from}`)
  if (!response.ok) throw new Error('FX request failed')
  const data = (await response.json()) as { result?: string; rates?: Record<string, number> }
  const rate = data.rates?.[to]
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('FX rate missing')
  }
  return rate
}

async function fetchHistoricalRate(from: string, to: string, onDate: string): Promise<number> {
  const fromCode = from.toLowerCase()
  const toCode = to.toLowerCase()
  let date = onDate
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${fromCode}.min.json`,
      `https://${date}.currency-api.pages.dev/v1/currencies/${fromCode}.min.json`,
    ]
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        const data = (await response.json()) as Record<string, unknown>
        const table = data[fromCode]
        if (table && typeof table === 'object') {
          const rate = (table as Record<string, number>)[toCode]
          if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) return rate
        }
      } catch {
        /* try next source or previous day */
      }
    }
    date = shiftIsoDate(date, -1)
  }
  return fetchLatestRate(from, to)
}

/** `onDate` (YYYY-MM-DD) uses that day's rate; omit or use today/future for live. */
export async function fetchExchangeRate(from: string, to: string, onDate?: string): Promise<number> {
  if (from === to) return 1
  const today = todayIso()
  if (!onDate || onDate >= today) return fetchLatestRate(from, to)
  return fetchHistoricalRate(from, to, onDate)
}

export function convertAmount(amount: number, rate: number) {
  return Math.round(amount * rate * 100) / 100
}
