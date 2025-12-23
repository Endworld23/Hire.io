'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export async function ensureProfile() {
  const supabase = (await createServerSupabase()) as any
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check existing profile
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id, tenant_id, role, email, full_name')
    .eq('id', user.id)
    .single()

  if (existingProfile && existingProfile.tenant_id) {
    return redirect('/dashboard')
  }

  // Create a tenant if missing
  let tenantId = existingProfile?.tenant_id || null
  if (!tenantId) {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: user.email || 'New Tenant',
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      console.error('[onboarding] tenant create error', { userId: user.id, message: tenantError?.message })
      return { success: false, error: 'Unable to create tenant' }
    }
    tenantId = (tenant as any).id
  }

  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      tenant_id: tenantId,
      role: (existingProfile as any)?.role || 'admin',
      full_name: (existingProfile as any)?.full_name || user.email || null,
    })

  if (profileError) {
    console.error('[onboarding] profile upsert error', { userId: user.id, message: profileError.message })
    return { success: false, error: 'Unable to update profile' }
  }

  return redirect('/dashboard')
}
