import { useQuery } from '@tanstack/react-query'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { cachedExchangeRate, convertAmount } from '@/features/accounts/lib/exchangeRate'
import type { Expense } from '@/features/expenses/hooks/useExpenses'

export function expensesOnMyAccounts(expenses: Expense[], accounts: Account[]) {
  const ids = new Set(accounts.map((account) => account.id))
  return expenses.filter((item) => ids.has(item.account_id))
}

/** Convert each expense `amount` (account currency) into `toCurrency` as `amount_base`. */
export async function expensesInCurrency(
  expenses: Expense[],
  accounts: Account[],
  toCurrency: string,
  online: boolean,
): Promise<Expense[]> {
  const currencyByAccount = new Map(accounts.map((account) => [account.id, account.currency]))
  const cache = new Map<string, number>()
  const next: Expense[] = []

  for (const expense of expenses) {
    const from = expense.account_currency ?? currencyByAccount.get(expense.account_id)
    if (!from) continue
    if (from === toCurrency) {
      next.push({ ...expense, amount_base: expense.amount })
      continue
    }
    if (!online) {
      next.push(expense)
      continue
    }
    const rate = await cachedExchangeRate(cache, from, toCurrency, expense.occurred_on)
    if (rate == null) {
      next.push(expense)
      continue
    }
    next.push({ ...expense, amount_base: convertAmount(expense.amount, rate) })
  }

  return next
}

export function useExpensesInCurrency(
  expenses: Expense[],
  accounts: Account[],
  toCurrency: string,
  online: boolean,
) {
  const fingerprint = expenses.map((item) => `${item.id}:${item.amount}:${item.occurred_on}`).join('|')
  const accountKey = accounts.map((item) => `${item.id}:${item.currency}`).join('|')
  const query = useQuery({
    queryKey: ['expenses', 'inCurrency', toCurrency, fingerprint, accountKey] as const,
    queryFn: () => expensesInCurrency(expenses, accounts, toCurrency, online),
    enabled: expenses.length > 0,
  })
  return query.data ?? expenses
}
