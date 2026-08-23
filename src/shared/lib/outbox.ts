import { get, set } from 'idb-keyval'
import type { ExpenseInput } from '@/features/expenses/hooks/useExpenses'

const OUTBOX_KEY = 'bankkhana-outbox'

export type OutboxItem = {
  id: string
  type: 'createExpense'
  payload: ExpenseInput
  createdAt: string
}

type Listener = () => void

const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeOutbox(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function readAll(): Promise<OutboxItem[]> {
  const rows = await get<OutboxItem[]>(OUTBOX_KEY)
  return rows ?? []
}

async function writeAll(rows: OutboxItem[]) {
  await set(OUTBOX_KEY, rows)
  emit()
}

export async function listOutbox(): Promise<OutboxItem[]> {
  return readAll()
}

export async function getOutboxPendingIds(): Promise<Set<string>> {
  const rows = await readAll()
  return new Set(rows.map((row) => row.id))
}

export async function enqueueCreateExpense(payload: ExpenseInput): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    type: 'createExpense',
    payload,
    createdAt: new Date().toISOString(),
  }
  const rows = await readAll()
  rows.push(item)
  await writeAll(rows)
  return item
}

export async function removeOutboxItem(id: string) {
  const rows = await readAll()
  await writeAll(rows.filter((row) => row.id !== id))
}

export async function clearOutbox() {
  await writeAll([])
}

export async function outboxCount(): Promise<number> {
  return (await readAll()).length
}

/** Snapshot helpers for useSyncExternalStore — count is refreshed via subscribeOutbox. */
let cachedCount = 0

export function getOutboxCountSnapshot() {
  return cachedCount
}

export function setOutboxCountSnapshot(n: number) {
  cachedCount = n
  emit()
}

export async function refreshOutboxCount() {
  cachedCount = await outboxCount()
  emit()
}
