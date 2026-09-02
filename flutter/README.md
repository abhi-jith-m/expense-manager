# Aureum (Flutter)

Native Android Flutter app for the Aureum personal expense tracker. The original React app is the functional reference; this client is a Material 3, mobile-first redesign — not a web layout squeezed onto a phone.

## Data backend

Same switch as the React app:

- If `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the `VITE_*` names from the web `.env`) are set, Flutter uses that Supabase project — the same `profiles`, accounts, transactions, budgets, goals, receipts, and Auth users as the web app.
- Sign in with the same email and password to see the same data.
- Set `DATA_BACKEND=local` (or `VITE_DATA_BACKEND=local`) to force the on-device store (`aureum.db.v1`) even when Supabase keys are present.
- Without keys, the app stays local.

Copy `dart_defines.example.json` to `dart_defines.json` (do not commit secrets) or pass the same values the web app uses:

```bash
# from flutter/
flutter run -d chrome --no-web-resources-cdn --dart-define-from-file=dart_defines.json

# or reuse the Vite env file from the repo root
flutter run -d chrome --no-web-resources-cdn --dart-define-from-file=../.env
```

Google sign-in uses Supabase OAuth. Add `com.aureum.aureum://login-callback` and your Flutter web origin (for example `http://localhost:8080`) under Authentication → URL Configuration → Redirect URLs.

## Insights

Insights and Ask Vio call the live FastAPI service at [https://expense-manager-jj72.onrender.com](https://expense-manager-jj72.onrender.com) (`/api/insights/*`). Override with `--dart-define=INSIGHTS_API_URL=https://host/api` if needed. Local calculated insights still appear on the dashboard if the service is unreachable.

Chrome (and other browsers) send a CORS preflight. The Render service must allow `http://localhost:<port>` — set `CORS_ORIGIN_REGEX` to include `http://(localhost|127\.0\.0\.1):\d+` and redeploy. Android and Linux desktop do not use CORS.

## Run

```bash
export PATH="$PATH:$HOME/flutter/bin"
cd flutter
flutter pub get
flutter run -d chrome --no-web-resources-cdn
# or: flutter run -d linux
# or: flutter run -d android
```

Chrome must use `--no-web-resources-cdn`. Without it, Flutter downloads CanvasKit from `gstatic.com` and the app stays blank if that request is blocked.

## Test

```bash
flutter test
```

## Notes

- Transfers never count toward income or expense totals.
- Recurring generation skips a date if a transaction with the same `recurring_id` and date already exists.
- Currency conversion is not implemented and is never faked.
- Local mode keeps data on device in shared preferences, isolated per local user.
