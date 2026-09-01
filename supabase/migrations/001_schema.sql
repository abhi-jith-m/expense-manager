-- Aureum schema, RLS, storage, and new-user seed.
-- Run this in the Supabase SQL editor or via the Supabase CLI.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  currency text not null default 'USD',
  date_format text not null default 'MMM d, yyyy',
  theme text not null default 'system',
  onboarding_completed boolean not null default false,
  notification_preferences jsonb not null default '{"budgetAlerts":true,"recurringAlerts":true,"goalAlerts":true,"importExportAlerts":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash','bank','credit','savings','wallet')),
  opening_balance numeric(14,2) not null default 0,
  currency text not null default 'USD',
  icon text not null default 'Landmark',
  color text not null default '#3B82F6',
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense','income')),
  icon text not null,
  color text not null,
  parent_id uuid references public.categories(id) on delete restrict,
  sort_order int not null default 0,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('expense','income','transfer')),
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.categories(id) on delete set null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid references public.accounts(id) on delete restrict,
  merchant text not null default '',
  description text not null default '',
  notes text not null default '',
  date date not null,
  payment_method text not null default 'card',
  tags text[] not null default '{}',
  recurring_id uuid,
  attachment_path text,
  attachment_name text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  period text not null check (period in ('weekly','monthly','yearly','custom')),
  start_date date not null,
  end_date date,
  alert_threshold numeric(5,2) not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('expense','income','transfer')),
  amount numeric(14,2) not null,
  currency text not null,
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid not null references public.accounts(id) on delete restrict,
  merchant text not null default '',
  notes text not null default '',
  payment_method text not null default 'card',
  frequency text not null,
  interval int not null default 1,
  start_date date not null,
  end_date date,
  next_occurrence date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
  add constraint transactions_recurring_fk
  foreign key (recurring_id) references public.recurring_transactions(id) on delete set null;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline date,
  icon text not null default 'Target',
  color text not null default '#8B5CF6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists transactions_user_id_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_category_id_idx on public.transactions(category_id);
create index if not exists budgets_user_id_idx on public.budgets(user_id);
create index if not exists recurring_user_id_idx on public.recurring_transactions(user_id);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_filters enable row level security;

drop policy if exists "profiles_own" on public.profiles;
drop policy if exists "accounts_own" on public.accounts;
drop policy if exists "categories_own" on public.categories;
drop policy if exists "transactions_own" on public.transactions;
drop policy if exists "budgets_own" on public.budgets;
drop policy if exists "recurring_own" on public.recurring_transactions;
drop policy if exists "goals_own" on public.goals;
drop policy if exists "notifications_own" on public.notifications;
drop policy if exists "saved_filters_own" on public.saved_filters;
create policy "profiles_own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "accounts_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "budgets_own" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recurring_own" on public.recurring_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_filters_own" on public.saved_filters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "receipts_own" on storage.objects;
drop policy if exists "avatars_own" on storage.objects;
create policy "receipts_own"
on storage.objects for all
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own"
on storage.objects for all
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.categories (user_id, name, kind, icon, color, sort_order, is_system)
  values
    (new.id, 'Food', 'expense', 'UtensilsCrossed', '#8B5CF6', 0, true),
    (new.id, 'Transport', 'expense', 'Car', '#3B82F6', 1, true),
    (new.id, 'Shopping', 'expense', 'ShoppingBag', '#EC4899', 2, true),
    (new.id, 'Bills', 'expense', 'Receipt', '#22D3EE', 3, true),
    (new.id, 'Entertainment', 'expense', 'Clapperboard', '#A855F7', 4, true),
    (new.id, 'Health', 'expense', 'HeartPulse', '#F43F5E', 5, true),
    (new.id, 'Education', 'expense', 'GraduationCap', '#6366F1', 6, true),
    (new.id, 'Travel', 'expense', 'Plane', '#6366F1', 7, true),
    (new.id, 'Housing', 'expense', 'House', '#A855F7', 8, true),
    (new.id, 'Other', 'expense', 'CircleEllipsis', '#94A3B8', 9, true),
    (new.id, 'Salary', 'income', 'Briefcase', '#8B5CF6', 10, true),
    (new.id, 'Freelance', 'income', 'Laptop', '#22D3EE', 11, true),
    (new.id, 'Business', 'income', 'Building2', '#3B82F6', 12, true),
    (new.id, 'Investments', 'income', 'TrendingUp', '#3B82F6', 13, true),
    (new.id, 'Gifts', 'income', 'Gift', '#EC4899', 14, true),
    (new.id, 'Other income', 'income', 'CircleEllipsis', '#94A3B8', 15, true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = auth.uid();
end;
$$;
