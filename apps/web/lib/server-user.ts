import { cookies } from 'next/headers'
import { createSupabaseClient } from '@hire-io/utils'
import { env } from '@/lib/env'

export type SupabaseUserProfile = {
  id: string
  tenant_id: string
  role: string
  full_name: string | null
}

export async function getCurrentUserProfile() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return null
  }

  const supabase = createSupabaseClient(env.supabaseUrl, env.supabaseSecretKey)
  const {
    data: { user },
  } = await supabase.auth.getUser(accessToken)

  if (!user) {
    return null
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userProfile as SupabaseUserProfile | null
}

export async function requireClientUser() {
  const user = await getCurrentUserProfile()
  if (!user || user.role !== 'client') {
    return null
  }
  return user
}
