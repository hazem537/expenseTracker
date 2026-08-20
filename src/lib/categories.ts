export const CATEGORIES = [
  'food',
  'transport',
  'housing',
  'bills',
  'shopping',
  'health',
  'entertainment',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_COLORS: Record<Category, string> = {
  food: '#0ea5e9',
  transport: '#6366f1',
  housing: '#a855f7',
  bills: '#f97316',
  shopping: '#ec4899',
  health: '#22c55e',
  entertainment: '#eab308',
  other: '#94a3b8',
}
