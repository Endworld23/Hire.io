'use server'

import { createServerSupabase } from '@/lib/supabase-server'

type Candidate = {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  owner_tenant_id?: string | null
  created_at?: string | null
}

async function getAuthedProfile() {
  const supabase = (await createServerSupabase()) as any
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
    .single()

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
    .select('id, full_name, email, phone, owner_tenant_id, created_at')
    .eq('owner_tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[candidates] list error', { message: error.message })
    return { candidates: [], error: error.message }
  }

  return { candidates: (data as Candidate[]) || [], error: undefined }
}

type CandidateInput = {
  full_name: string
  email: string
  phone?: string | null
}

export async function createCandidate(input: CandidateInput) {
  const ctx = await getAuthedProfile()
  if ('error' in ctx) {
    return { candidate: null, error: ctx.error }
  }

  const { supabase, profile } = ctx

  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    return { candidate: null, error: 'Unauthorized' }
  }

  const tenantId = profile.tenant_id as string

  if (!input.full_name || !input.email) {
    return { candidate: null, error: 'Full name and email are required.' }
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      owner_tenant_id: tenantId,
      is_global: false,
    })
    .select('id, full_name, email, phone, owner_tenant_id, created_at')
    .single()

  if (error) {
    console.warn('[candidates] create error', { message: error.message })
    return { candidate: null, error: error.message }
  }

  return { candidate: data as Candidate, error: undefined }
}

export async function updateCandidate(candidateId: string, input: CandidateInput) {
  const ctx = await getAuthedProfile()
  if ('error' in ctx) {
    return { candidate: null, error: ctx.error }
  }

  const { supabase, profile } = ctx

  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    return { candidate: null, error: 'Unauthorized' }
  }

  const tenantId = profile.tenant_id as string

  if (!input.full_name || !input.email) {
    return { candidate: null, error: 'Full name and email are required.' }
  }

  const { data, error } = await supabase
    .from('candidates')
    .update({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
    })
    .eq('id', candidateId)
    .eq('owner_tenant_id', tenantId)
    .select('id, full_name, email, phone, owner_tenant_id, created_at')
    .single()

  if (error) {
    console.warn('[candidates] update error', { message: error.message })
    return { candidate: null, error: error.message }
  }

  return { candidate: data as Candidate, error: undefined }
}
