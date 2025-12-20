import { createSupabaseClient } from '@hire-io/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabasePublishableKey)

export * from '@hire-io/utils'
