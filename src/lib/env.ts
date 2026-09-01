export function hasSupabaseConfig(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  )
}

export function resolveBackend(): 'supabase' | 'local' {
  if (import.meta.env.VITE_DATA_BACKEND === 'local') return 'local'
  if (hasSupabaseConfig()) return 'supabase'
  return 'local'
}

export function isLocalBackend(): boolean {
  return resolveBackend() === 'local'
}
