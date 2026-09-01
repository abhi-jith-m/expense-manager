/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_DATA_BACKEND?: 'supabase' | 'local'
  readonly VITE_INSIGHTS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
