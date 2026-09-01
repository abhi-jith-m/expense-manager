create table if not exists public.insight_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  analysis_period_start date not null,
  analysis_period_end date not null,
  summary text not null default '',
  financial_health_summary text not null default '',
  metrics_json jsonb not null default '{}'::jsonb,
  used_fallback boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.insights (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  analysis_id uuid references public.insight_analyses(id) on delete cascade,
  analysis_period_start date not null,
  analysis_period_end date not null,
  type text not null,
  title text not null,
  summary text not null,
  explanation text not null,
  severity text not null,
  confidence numeric(5,2) not null default 0.8,
  impact_score numeric(8,2) not null default 0,
  metrics_json jsonb not null default '{}'::jsonb,
  recommendation text,
  category text,
  related_transaction_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.insight_feedback (
  id uuid primary key default gen_random_uuid(),
  insight_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback text not null,
  created_at timestamptz not null default now()
);

create index if not exists insights_user_id_idx on public.insights(user_id, created_at desc);
create index if not exists insight_analyses_user_id_idx on public.insight_analyses(user_id, created_at desc);

alter table public.insight_analyses enable row level security;
alter table public.insights enable row level security;
alter table public.insight_feedback enable row level security;

drop policy if exists "insight_analyses_own" on public.insight_analyses;
drop policy if exists "insights_own" on public.insights;
drop policy if exists "insight_feedback_own" on public.insight_feedback;
create policy "insight_analyses_own" on public.insight_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insights_own" on public.insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insight_feedback_own" on public.insight_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
