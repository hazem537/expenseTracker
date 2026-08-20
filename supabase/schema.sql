-- Run this in the Supabase SQL editor (safe to re-run).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists gold_price_24 numeric(14, 4);
alter table public.profiles add column if not exists gold_price_21 numeric(14, 4);
alter table public.profiles add column if not exists gold_price_18 numeric(14, 4);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null,
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

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

alter table public.expenses
  add column if not exists account_id uuid references public.accounts (id) on delete restrict;

alter table public.expenses
  add column if not exists amount_base numeric(12, 2);

alter table public.expenses
  add column if not exists fx_rate numeric(18, 8);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  to_account_id uuid not null references public.accounts (id) on delete restrict,
  from_amount numeric(14, 2) not null check (from_amount > 0),
  to_amount numeric(14, 2) not null check (to_amount > 0),
  fx_rate numeric(18, 8) not null check (fx_rate > 0),
  occurred_on date not null,
  note text,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists expenses_user_occurred_on_idx
  on public.expenses (user_id, occurred_on desc);

create table if not exists public.gold_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  grams numeric(12, 3) not null check (grams > 0),
  karat smallint not null check (karat in (24, 21, 18)),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  shares numeric(18, 6) not null check (shares > 0),
  avg_cost numeric(18, 6) not null check (avg_cost >= 0),
  quote_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists gold_holdings_user_idx on public.gold_holdings (user_id);
create index if not exists stock_holdings_user_idx on public.stock_holdings (user_id);
create index if not exists accounts_user_idx on public.accounts (user_id);
create index if not exists transfers_user_idx on public.transfers (user_id, occurred_on desc);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.expenses enable row level security;
alter table public.transfers enable row level security;
alter table public.gold_holdings enable row level security;
alter table public.stock_holdings enable row level security;

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own accounts" on public.accounts;
create policy "Users can manage own accounts"
  on public.accounts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can select own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can select own expenses"
  on public.expenses for select using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
  );

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
  );

create policy "Users can delete own expenses"
  on public.expenses for delete using (auth.uid() = user_id);

drop policy if exists "Users can manage own stock holdings" on public.stock_holdings;
create policy "Users can manage own stock holdings"
  on public.stock_holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own gold holdings" on public.gold_holdings;
create policy "Users can manage own gold holdings"
  on public.gold_holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own transfers" on public.transfers;
create policy "Users can manage own transfers"
  on public.transfers
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.accounts a where a.id = from_account_id and a.user_id = auth.uid())
    and exists (select 1 from public.accounts a where a.id = to_account_id and a.user_id = auth.uid())
  );
