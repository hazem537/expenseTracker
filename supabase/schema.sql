-- Run this in the Supabase SQL editor (safe to re-run).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_currency text not null default 'EGP',
  updated_at timestamptz not null default now()
);

alter table public.profiles alter column default_currency set default 'EGP';

alter table public.profiles add column if not exists gold_price_24 numeric(14, 4);
alter table public.profiles add column if not exists gold_price_21 numeric(14, 4);
alter table public.profiles add column if not exists gold_price_18 numeric(14, 4);
alter table public.profiles add column if not exists display_name text;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null,
  balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.accounts add column if not exists share_code text;
alter table public.accounts add column if not exists hide_on_dashboard boolean not null default false;
create unique index if not exists accounts_share_code_uidx
  on public.accounts (share_code)
  where share_code is not null;

create table if not exists public.account_members (
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

create index if not exists account_members_user_idx on public.account_members (user_id);

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

alter table public.expenses
  add column if not exists amount_group numeric(12, 2);

alter table public.expenses
  add column if not exists group_fx_rate numeric(18, 8);

alter table public.expenses
  add column if not exists account_currency text;

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

create index if not exists expenses_account_idx on public.expenses (account_id);

create index if not exists expenses_account_occurred_idx
  on public.expenses (account_id, occurred_on desc);

create index if not exists expenses_account_user_idx
  on public.expenses (account_id, user_id);

create index if not exists expenses_account_category_idx
  on public.expenses (account_id, category);

create table if not exists public.account_deposits (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null default (current_date),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists account_deposits_account_occurred_idx
  on public.account_deposits (account_id, occurred_on desc);

create index if not exists account_deposits_account_user_idx
  on public.account_deposits (account_id, user_id);

create table if not exists public.gold_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  grams numeric(12, 3) not null check (grams > 0),
  karat smallint not null check (karat in (24, 21, 18)),
  avg_cost numeric(18, 6) not null default 0 check (avg_cost >= 0),
  note text,
  created_at timestamptz not null default now()
);

alter table public.gold_holdings
  add column if not exists avg_cost numeric(18, 6) not null default 0;

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

-- Backfill: every account creator is a member
insert into public.account_members (account_id, user_id)
select a.id, a.user_id
from public.accounts a
on conflict do nothing;

-- Auto-add creator as member on new accounts (needed before membership RLS applies)
create or replace function public.handle_new_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.account_members (account_id, user_id)
  values (new.id, new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_account_created on public.accounts;
create trigger on_account_created
  after insert on public.accounts
  for each row execute function public.handle_new_account();

-- Helpers (security definer avoids RLS recursion)
create or replace function public.is_account_member(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_members
    where account_id = p_account_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_account_creator(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.accounts
    where id = p_account_id and user_id = auth.uid()
  );
$$;

create or replace function public.join_account_by_share_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_normalized text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_normalized := upper(trim(p_code));
  if v_normalized = '' then
    raise exception 'Invalid share code';
  end if;

  select id into v_account_id
  from public.accounts
  where share_code = v_normalized
  limit 1;

  if v_account_id is null then
    raise exception 'Invalid share code';
  end if;

  insert into public.account_members (account_id, user_id)
  values (v_account_id, auth.uid())
  on conflict do nothing;

  return v_account_id;
end;
$$;

create or replace function public.get_account_members(p_account_id uuid)
returns table (user_id uuid, display_name text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.user_id,
    p.display_name,
    u.email::text
  from public.account_members m
  left join public.profiles p on p.user_id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.account_id = p_account_id
    and public.is_account_member(p_account_id);
$$;

grant execute on function public.is_account_member(uuid) to authenticated;
grant execute on function public.is_account_creator(uuid) to authenticated;
grant execute on function public.join_account_by_share_code(text) to authenticated;
grant execute on function public.get_account_members(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_members enable row level security;
alter table public.expenses enable row level security;
alter table public.transfers enable row level security;
alter table public.gold_holdings enable row level security;
alter table public.stock_holdings enable row level security;

drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "Users can select related profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can select related profiles"
  on public.profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.account_members me
      join public.account_members them on them.account_id = me.account_id
      where me.user_id = auth.uid() and them.user_id = profiles.user_id
    )
  );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can manage own accounts" on public.accounts;
drop policy if exists "Members can select accounts" on public.accounts;
drop policy if exists "Users can insert own accounts" on public.accounts;
drop policy if exists "Members can update accounts" on public.accounts;
drop policy if exists "Creators can delete accounts" on public.accounts;

create policy "Members can select accounts"
  on public.accounts for select
  using (public.is_account_member(id));

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Members can update accounts"
  on public.accounts for update
  using (public.is_account_member(id))
  with check (public.is_account_member(id));

create policy "Creators can delete accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can see memberships for their accounts" on public.account_members;
drop policy if exists "Creator can add self as member" on public.account_members;
drop policy if exists "Users can leave shared accounts" on public.account_members;

create policy "Users can see memberships for their accounts"
  on public.account_members for select
  using (public.is_account_member(account_id));

create policy "Creator can add self as member"
  on public.account_members for insert
  with check (
    user_id = auth.uid()
    and public.is_account_creator(account_id)
  );

create policy "Users can leave shared accounts"
  on public.account_members for delete
  using (
    user_id = auth.uid()
    and not public.is_account_creator(account_id)
  );

drop policy if exists "Users can select own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;
drop policy if exists "Members can select account expenses" on public.expenses;
drop policy if exists "Members can insert expenses" on public.expenses;
drop policy if exists "Members can update account expenses" on public.expenses;
drop policy if exists "Members can delete account expenses" on public.expenses;

create policy "Members can select account expenses"
  on public.expenses for select
  using (account_id is not null and public.is_account_member(account_id));

create policy "Members can insert expenses"
  on public.expenses for insert
  with check (
    auth.uid() = user_id
    and account_id is not null
    and public.is_account_member(account_id)
  );

create policy "Members can update account expenses"
  on public.expenses for update
  using (account_id is not null and public.is_account_member(account_id))
  with check (
    account_id is not null
    and public.is_account_member(account_id)
  );

create policy "Members can delete account expenses"
  on public.expenses for delete
  using (account_id is not null and public.is_account_member(account_id));

alter table public.account_deposits enable row level security;

drop policy if exists "Members can select account deposits" on public.account_deposits;
drop policy if exists "Members can insert account deposits" on public.account_deposits;
drop policy if exists "Members can delete account deposits" on public.account_deposits;

create policy "Members can select account deposits"
  on public.account_deposits for select
  using (public.is_account_member(account_id));

create policy "Members can insert account deposits"
  on public.account_deposits for insert
  with check (
    auth.uid() = user_id
    and public.is_account_member(account_id)
  );

create policy "Members can delete account deposits"
  on public.account_deposits for delete
  using (
    auth.uid() = user_id
    and public.is_account_member(account_id)
  );

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
drop policy if exists "Members can manage transfers" on public.transfers;

create policy "Members can manage transfers"
  on public.transfers
  for all
  using (
    public.is_account_member(from_account_id)
    and public.is_account_member(to_account_id)
  )
  with check (
    auth.uid() = user_id
    and public.is_account_member(from_account_id)
    and public.is_account_member(to_account_id)
  );

-- ---------------------------------------------------------------------------
-- Expense groups (shared expense pots — not bank accounts)
-- ---------------------------------------------------------------------------

create table if not exists public.expense_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  currency text not null,
  share_code text,
  created_at timestamptz not null default now()
);

create unique index if not exists expense_groups_share_code_uidx
  on public.expense_groups (share_code)
  where share_code is not null;

alter table public.expense_groups add column if not exists archived boolean not null default false;

create index if not exists expense_groups_user_idx on public.expense_groups (user_id);

create table if not exists public.expense_group_members (
  group_id uuid not null references public.expense_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists expense_group_members_user_idx on public.expense_group_members (user_id);

alter table public.expenses
  add column if not exists group_id uuid references public.expense_groups (id) on delete set null;

create index if not exists expenses_group_idx on public.expenses (group_id);

create or replace function public.handle_new_expense_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.expense_group_members (group_id, user_id)
  values (new.id, new.user_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_expense_group_created on public.expense_groups;
create trigger on_expense_group_created
  after insert on public.expense_groups
  for each row execute function public.handle_new_expense_group();

create or replace function public.is_expense_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.expense_group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_expense_group_creator(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.expense_groups
    where id = p_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.join_expense_group_by_share_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_normalized text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_normalized := upper(trim(p_code));
  if v_normalized = '' then
    raise exception 'Invalid share code';
  end if;

  select id into v_group_id
  from public.expense_groups
  where share_code = v_normalized
  limit 1;

  if v_group_id is null then
    raise exception 'Invalid share code';
  end if;

  insert into public.expense_group_members (group_id, user_id)
  values (v_group_id, auth.uid())
  on conflict do nothing;

  return v_group_id;
end;
$$;

create or replace function public.get_expense_group_members(p_group_id uuid)
returns table (user_id uuid, display_name text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.user_id,
    p.display_name,
    u.email::text
  from public.expense_group_members m
  left join public.profiles p on p.user_id = m.user_id
  left join auth.users u on u.id = m.user_id
  where m.group_id = p_group_id
    and public.is_expense_group_member(p_group_id);
$$;

create or replace function public.get_expense_group_account_currencies(p_group_id uuid)
returns table (account_id uuid, currency text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct e.account_id, a.currency
  from public.expenses e
  join public.accounts a on a.id = e.account_id
  where e.group_id = p_group_id
    and public.is_expense_group_member(p_group_id);
$$;

grant execute on function public.is_expense_group_member(uuid) to authenticated;
grant execute on function public.is_expense_group_creator(uuid) to authenticated;
grant execute on function public.join_expense_group_by_share_code(text) to authenticated;
grant execute on function public.get_expense_group_members(uuid) to authenticated;
grant execute on function public.get_expense_group_account_currencies(uuid) to authenticated;

alter table public.expense_groups enable row level security;
alter table public.expense_group_members enable row level security;

drop policy if exists "Members can select expense groups" on public.expense_groups;
drop policy if exists "Users can insert expense groups" on public.expense_groups;
drop policy if exists "Members can update expense groups" on public.expense_groups;
drop policy if exists "Creators can delete expense groups" on public.expense_groups;

create policy "Members can select expense groups"
  on public.expense_groups for select
  using (public.is_expense_group_member(id));

create policy "Users can insert expense groups"
  on public.expense_groups for insert
  with check (auth.uid() = user_id);

create policy "Members can update expense groups"
  on public.expense_groups for update
  using (public.is_expense_group_member(id))
  with check (public.is_expense_group_member(id));

create policy "Creators can delete expense groups"
  on public.expense_groups for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can see expense group memberships" on public.expense_group_members;
drop policy if exists "Creator can add self to expense group" on public.expense_group_members;
drop policy if exists "Users can leave expense groups" on public.expense_group_members;

create policy "Users can see expense group memberships"
  on public.expense_group_members for select
  using (public.is_expense_group_member(group_id));

create policy "Creator can add self to expense group"
  on public.expense_group_members for insert
  with check (
    user_id = auth.uid()
    and public.is_expense_group_creator(group_id)
  );

create policy "Users can leave expense groups"
  on public.expense_group_members for delete
  using (
    user_id = auth.uid()
    and not public.is_expense_group_creator(group_id)
  );

-- Expenses: account members OR expense-group members (so friends see each other's group spends)
drop policy if exists "Members can select account expenses" on public.expenses;
drop policy if exists "Members can insert expenses" on public.expenses;
drop policy if exists "Members can update account expenses" on public.expenses;
drop policy if exists "Members can delete account expenses" on public.expenses;

create policy "Members can select account expenses"
  on public.expenses for select
  using (
    (account_id is not null and public.is_account_member(account_id))
    or (group_id is not null and public.is_expense_group_member(group_id))
  );

create policy "Members can insert expenses"
  on public.expenses for insert
  with check (
    auth.uid() = user_id
    and account_id is not null
    and public.is_account_member(account_id)
    and (
      group_id is null
      or public.is_expense_group_member(group_id)
    )
  );

create policy "Members can update account expenses"
  on public.expenses for update
  using (
    (account_id is not null and public.is_account_member(account_id))
    or (group_id is not null and public.is_expense_group_member(group_id))
  )
  with check (
    account_id is not null
    and public.is_account_member(account_id)
    and (
      group_id is null
      or public.is_expense_group_member(group_id)
    )
  );

create policy "Members can delete account expenses"
  on public.expenses for delete
  using (
    (account_id is not null and public.is_account_member(account_id))
    or (group_id is not null and public.is_expense_group_member(group_id))
  );

-- Profiles: also visible to expense-group co-members
drop policy if exists "Users can select related profiles" on public.profiles;
create policy "Users can select related profiles"
  on public.profiles for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.account_members me
      join public.account_members them on them.account_id = me.account_id
      where me.user_id = auth.uid() and them.user_id = profiles.user_id
    )
    or exists (
      select 1
      from public.expense_group_members me
      join public.expense_group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = profiles.user_id
    )
  );
