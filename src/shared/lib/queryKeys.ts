export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    list: ['accounts', 'list'] as const,
    detailPrefix: ['accounts', 'detail'] as const,
    detail: (accountId: string) => ['accounts', 'detail', accountId] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    list: (range?: { start: string; end: string }) =>
      range
        ? (['expenses', 'list', range.start, range.end] as const)
        : (['expenses', 'list', 'all'] as const),
    byAccount: (accountId: string) => ['expenses', 'account', accountId] as const,
  },
  expenseGroups: {
    all: ['expenseGroups'] as const,
    list: ['expenseGroups', 'list'] as const,
    detail: (groupId: string) => ['expenseGroups', 'detail', groupId] as const,
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
