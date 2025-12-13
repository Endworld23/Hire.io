import { createClient } from '@supabase/supabase-js'
import type {
  SupabaseClient as SupabaseJsClient,
  SupabaseClientOptions,
} from '@supabase/supabase-js'
import type { Database } from './types'

type EnsureRelationships<T> = T extends { Relationships: any }
  ? T
  : T & { Relationships: [] }

type WrapTables<Tables> = {
  [K in keyof Tables]: EnsureRelationships<Tables[K]>
}

type WrappedDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: WrapTables<Database['public']['Tables']>
  }
}

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: SupabaseClientOptions<'public'>
) {
  return createClient<WrappedDatabase>(supabaseUrl, supabaseKey, options)
}

export type SupabaseClient = SupabaseJsClient<WrappedDatabase>
