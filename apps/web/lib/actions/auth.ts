'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { SignUpInput, SignInInput } from '@hire-io/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    }
  })
}

export async function signUp(data: SignUpInput) {
  const supabase = getSupabase()
  const { email, password, fullName, companyName, subdomain } = data

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
        subdomain,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      }
    }
  )

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: companyName,
      subdomain,
    })
    .select()
    .single()

  if (tenantError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create tenant: ' + tenantError.message }
  }

  const { error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id: tenant.id,
      email,
      full_name: fullName,
      role: 'admin',
    })

  if (userError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
    return { error: 'Failed to create user profile: ' + userError.message }
  }

  const { error: eventError } = await supabaseAdmin
    .from('events')
    .insert({
      tenant_id: tenant.id,
      actor_user_id: authData.user.id,
      entity_type: 'tenant',
      entity_id: tenant.id,
      action: 'created',
      metadata: {
        company_name: companyName,
        subdomain,
        admin_email: email,
      }
    })

  if (eventError) {
    console.error('Failed to log tenant creation event:', eventError)
  }

  return { success: true, userId: authData.user.id }
}

export async function signIn(data: SignInInput) {
  const supabase = getSupabase()

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.session) {
    return { error: 'No session created' }
  }

  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', authData.session.access_token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })
  cookieStore.set('sb-refresh-token', authData.session.refresh_token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  })

  const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('tenant_id, role')
    .eq('id', authData.user.id)
    .single()

  if (user) {
    await supabaseAdmin
      .from('events')
      .insert({
        tenant_id: user.tenant_id,
        actor_user_id: authData.user.id,
        entity_type: 'auth',
        entity_id: authData.user.id,
        action: 'sign_in',
        metadata: {
          email: data.email,
          role: user.role,
        }
      })
  }

  revalidatePath('/', 'layout')

  if (user?.role === 'admin' || user?.role === 'recruiter') {
    redirect('/dashboard')
  } else if (user?.role === 'client') {
    redirect('/client')
  } else if (user?.role === 'candidate') {
    redirect('/candidate')
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = getSupabase()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')

  revalidatePath('/', 'layout')
  redirect('/sign-in')
}

export async function resetPassword(email: string) {
  const supabase = getSupabase()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = getSupabase()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
