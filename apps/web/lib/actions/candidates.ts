'use server'

import { createServerSupabase } from '@/lib/supabase-server'

type Role = 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'

type Profile = {
  id: string
  tenant_id: string | null
  role: Role
}

type Candidate = {
  id: string
  full_name?: string | null
  email?: string | null
  owner_tenant_id?: string | null
}

async function getAuthedProfile() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[candidates] getUser error', { message: userError.message })
    return { error: 'Session error', supabase }
  }

  if (!user) {
    return { error: 'Unauthorized', supabase }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single<Profile>()

  if (profileError || !profile || !profile.tenant_id) {
    console.warn('[candidates] profile error', { message: profileError?.message, userId: user.id })
    return { error: 'Profile not available', supabase }
  }

  return { supabase, profile }
}

export async function listCandidatesForTenant() {
  const ctx = await getAuthedProfile()
  if ('error' in ctx) {
    return { candidates: [], error: ctx.error }
  }

  const { supabase, profile } = ctx

  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    return { candidates: [], error: 'Unauthorized' }
  }

  const tenantId = profile.tenant_id as string

  const { data, error } = await supabase
    .from('candidates')
    .select('id, full_name, email, owner_tenant_id')
    .eq('owner_tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[candidates] list error', { message: error.message })
    return { candidates: [], error: error.message }
  }

  return { candidates: (data as Candidate[]) || [], error: undefined }
}
