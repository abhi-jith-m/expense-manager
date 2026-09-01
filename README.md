# Aureum

A production-ready personal expense tracker. React, Vite, TypeScript, Tailwind CSS, and a swappable data layer that uses **Supabase** in production or a **local IndexedDB/localStorage** backend when cloud credentials are not configured.

The UI never talks to the database directly. Feature pages call a `DataClient` interface so the backend can be replaced without rewriting screens.

## Features

- Email authentication, session persistence, password reset, and protected routes
- Dashboard with live metrics, trend charts, category breakdown, budgets, and recent activity
- Transactions with search, filters, sorting, pagination, bulk actions, duplicates, and receipts
- Income, transfers, accounts/wallets, categories and subcategories
- Budgets with usage, projection, and real (not fabricated) alerts
- Recurring rules that generate transactions without duplicates
- Goals, analytics insights, professional reports, CSV/XLSX/JSON import wizard
- AI Financial Insights agent (FastAPI + LangGraph + NVIDIA Kimi) with deterministic math and calculated fallback
- Dark mode, mobile navigation, empty/loading/error states
- Row Level Security SQL for Supabase and isolated local user stores

## 1. Installation

```bash
npm install
```

## 2. Environment setup

Copy the example file and fill in values:

```bash
cp .env.example .env
```

| Variable | Required in production | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Project URL from Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key. Never put the service-role key in the frontend. |
| `VITE_DATA_BACKEND` | No | Set to `local` to force browser persistence. Omit in production. |
| `VITE_INSIGHTS_API_URL` | No | Insights API origin. Defaults to `/api` (Vite proxies to port 8002). |

If Supabase variables are missing, the app automatically uses the local backend so you can develop without a cloud project. Local mode is not a substitute for production.

## 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Enable Email auth under Authentication → Providers.
3. Optional: enable Google OAuth in the same panel and add your site URL.
4. Set the Site URL and redirect URLs to your local origin (`http://localhost:5173`) and your Vercel domain. Include `/reset-password`.
5. Run the SQL in `supabase/migrations/001_schema.sql` (SQL editor or Supabase CLI).

That migration creates:

- `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `recurring_transactions`, `goals`, `notifications`, `saved_filters`
- Foreign keys and indexes
- Row Level Security so `auth.uid()` can only read and write its own rows
- Storage buckets `receipts` (private, signed URLs) and `avatars` (public, user-scoped)
- A signup trigger that seeds default categories
- `delete_own_account()` for account deletion

## 4. Database schema and RLS

Every private table has a `user_id` (or `id` on `profiles`) and an RLS policy of the form:

```sql
auth.uid() = user_id
```

Frontend filters are convenience only. Isolation is enforced in Postgres.

Receipt paths are `{user_id}/{transaction_id}/{filename}`. Storage policies require the first folder name to match the signed-in user.

## 5. AI insights backend

The React app never runs the LangGraph agent. Start the FastAPI service:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8002
```

Set `NVIDIA_API_KEY` in `backend/.env` to use `moonshotai/kimi-k3`. If the NVIDIA API is unreachable, the dashboard still shows calculated insights.

```bash
cd backend && pytest
docker compose up insights
```

Apply `supabase/migrations/002_insights.sql` if you want persisted insight history in Supabase.

## 6. Local development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Without Supabase env vars you can sign up immediately. Data persists in this browser. Sample data in Settings is tagged `isSample` and can be removed independently.

```bash
npm test
npm run lint
```

## 7. Production build

```bash
npm run build
npm run preview
```

The build is a static SPA. `vercel.json` rewrites unknown routes to `index.html`.

## 8. Vercel deployment

1. Import the repository in Vercel.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Project Settings → Environment Variables.
4. Do **not** set `VITE_DATA_BACKEND=local` in production.
5. Add the Vercel URL to Supabase Auth redirect allow-list.
6. Redeploy after changing env vars.

## 9. Environment variables (production)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Only the anon key belongs in the browser. The service role key must stay on the server or in the Supabase dashboard.

## Architecture

```
src/             React + Vite app
backend/        FastAPI + LangGraph insights agent
  app/analytics  deterministic money, trends, budgets, anomalies
  app/agents     LangGraph workflow and chat
  app/api        /api/insights/*
supabase/        SQL + RLS including 002_insights.sql
```

Financial math lives in `src/lib/money.ts` and uses integer cents to avoid floating-point errors.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and production bundle |
| `npm run preview` | Serve the production bundle |
| `npm test` | Vitest |
| `npm run lint` | Oxlint |

## Notes

- Transfers never count toward income or expense totals.
- Recurring generation skips a date if a transaction with the same `recurring_id` and date already exists.
- Insights are derived from the selected range versus the previous period. They are omitted when there is not enough history.
- Currency conversion is not implemented and is never faked.
