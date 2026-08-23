export const queryKeys = {
  expenses: {
    all: ['expenses'] as const,
    list: (range?: { start: string; end: string }) =>
      range
        ? (['expenses', 'list', range.start, range.end] as const)
        : (['expenses', 'list', 'all'] as const),
  },
  accounts: {
    all: ['accounts'] as const,
    list: ['accounts', 'list'] as const,
  },
  gold: {
    all: ['gold'] as const,
    holdings: ['gold', 'holdings'] as const,
  },
  stocks: {
    all: ['stocks'] as const,
    holdings: ['stocks', 'holdings'] as const,
    quotes: (symbols: string[]) => ['stocks', 'quotes', ...symbols] as const,
  },
  profile: {
    all: ['profile'] as const,
    current: ['profile', 'current'] as const,
  },
}
