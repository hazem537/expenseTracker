create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null check (
    category in (
      'food',
      'transport',
      'housing',
      'bills',
      'shopping',
      'health',
      'entertainment',
      'other'
    )
  ),
  occurred_on date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_occurred_on_idx
  on public.expenses (user_id, occurred_on desc);

alter table public.expenses enable row level security;

create policy "Users can select own expenses"
  on public.expenses
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses
  for delete
  using (auth.uid() = user_id);
