import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'

const PERSIST_KEY = 'bankkhana-query-cache'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    },
  },
})

const idbStorage = {
  getItem: async (key: string) => (await get<string>(key)) ?? null,
  setItem: async (key: string, value: string) => {
    await set(key, value)
  },
  removeItem: async (key: string) => {
    await del(key)
  },
}

export const queryPersister = createAsyncStoragePersister({
  storage: idbStorage,
  key: PERSIST_KEY,
})

const PERSIST_ROOTS = new Set(['expenses', 'accounts', 'expenseGroups', 'profile', 'gold', 'stocks'])

export function shouldPersistQuery(queryKey: readonly unknown[]) {
  const root = queryKey[0]
  if (typeof root !== 'string' || !PERSIST_ROOTS.has(root)) return false
  // Never persist live stock quotes
  if (root === 'stocks' && queryKey[1] === 'quotes') return false
  return true
}

export async function clearPersistedQueryCache() {
  await idbStorage.removeItem(PERSIST_KEY)
}
