'use server'

import { redirect } from 'next/navigation'
import { createSupabaseClient, type SupabaseClient } from '@hire-io/utils'

type SignUpResult = {
  success: boolean
  fieldErrors?: Record<string, string>
  formError?: string
}

type SignUpValues = {
  fullName: string
  companyName: string
  email: string
  password: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function validateSignUpForm(formData: FormData): {
  values: SignUpValues | null
  errors: Record<string, string>
} {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const companyName = String(formData.get('companyName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const errors: Record<string, string> = {}

  if (!fullName) {
    errors.fullName = 'Full name is required.'
  }

  if (!companyName) {
    errors.companyName = 'Company name is required.'
  }

  if (!email) {
    errors.email = 'Email is required.'
  } else if (!email.includes('@')) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors }
  }

  return {
    values: { fullName, companyName, email, password },
    errors: {},
  }
}

function getSupabaseClients(): {
  anon: SupabaseClient
  service: SupabaseClient
} {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const anon = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })

  const service = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return { anon, service }
}

/**
 * Server action used by the sign-up form.
 *
 * Expected form fields:
 * - fullName
 * - companyName
 * - email
 * - password
 */
export async function signUpWithTenant(
  formData: FormData
): Promise<SignUpResult> {
  const { values, errors } = validateSignUpForm(formData)

  if (!values) {
    return { success: false, fieldErrors: errors }
  }

  const { fullName, companyName, email, password } = values

  let anonClient: SupabaseClient
  let serviceClient: SupabaseClient

  try {
    const clients = getSupabaseClients()
    anonClient = clients.anon
    serviceClient = clients.service
  } catch (error) {
    console.error('Supabase configuration error:', error)
    return {
      success: false,
      formError: 'Server configuration error. Please try again later.',
    }
  }

  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp(
    {
      email,
      password,
    }
  )

  if (signUpError) {
    console.error('Supabase signUp error:', signUpError)
    return {
      success: false,
      formError: signUpError.message ?? 'Unable to create account.',
    }
  }

  const user = signUpData.user

  if (!user) {
    console.error('Supabase signUp returned no user object.')
    return {
      success: false,
      formError: 'Unable to create account. Please try again.',
    }
  }

  const { data: tenant, error: tenantError } = await serviceClient
    .from('tenants')
    .insert({ name: companyName })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    console.error('Tenant creation failed:', tenantError)
    return {
      success: false,
      formError:
        'Failed to create your organization. Please contact support if this persists.',
    }
  }

  const { error: userInsertError } = await serviceClient.from('users').insert({
    id: user.id,
    tenant_id: tenant.id,
    role: 'admin',
    email,
    full_name: fullName,
  })

  if (userInsertError) {
    console.error('Users row creation failed:', userInsertError)
    return {
      success: false,
      formError:
        'Failed to create your user profile. Please contact support if this persists.',
    }
  }

  const { error: metadataError } =
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        tenant_id: tenant.id,
        role: 'admin',
        full_name: fullName,
      },
    })

  if (metadataError) {
    console.error('Failed to set user metadata:', metadataError)
    return {
      success: false,
      formError:
        'Your account was created, but we could not finish setup. Please contact support.',
    }
  }

  redirect('/dashboard')
}
