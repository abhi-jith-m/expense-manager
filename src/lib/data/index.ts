import { resolveBackend } from '@/lib/env'
import { createLocalClient } from '@/lib/data/local'
import { createSupabaseClient } from '@/lib/data/supabase-data'
import type { DataClient } from '@/lib/data/client'

let instance: DataClient | null = null

export function getDataClient(): DataClient {
  if (instance) return instance
  instance = resolveBackend() === 'supabase' ? createSupabaseClient() : createLocalClient()
  return instance
}

export function resetDataClient(): void {
  instance = null
}
