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
  food: '#8b5e3c',
  transport: '#1a2740',
  housing: '#c9a227',
  bills: '#6d4c2b',
  shopping: '#3d5a45',
  health: '#1b7a52',
  entertainment: '#b8860b',
  other: '#6d6558',
}
