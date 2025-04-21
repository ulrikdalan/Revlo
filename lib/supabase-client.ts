import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function createClientSupabaseClient() {
  return createClientComponentClient()
} 