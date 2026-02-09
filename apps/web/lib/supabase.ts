import { createSupabaseClient } from '@hire-io/utils'
import { envPublic } from '@/lib/env.public'

export const supabase = createSupabaseClient(
  envPublic.supabaseUrl,
  envPublic.supabasePublishableKey
)

export * from '@hire-io/utils'
