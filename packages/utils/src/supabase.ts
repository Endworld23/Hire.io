import { createClient } from '@supabase/supabase-js'
import type { SupabaseClientOptions } from '@supabase/supabase-js'
import type { Database } from './types'

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<'public'>
) {
  return createClient<Database>(supabaseUrl, supabaseKey, options)
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>
