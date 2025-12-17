'use server'

import { redirect } from 'next/navigation'
import { createSupabaseClient, type SupabaseClient } from '@hire-io/utils'
import { createServerSupabase } from '@/lib/supabase-server'

type SignUpResult = {
  success: boolean
  fieldErrors?: Record<string, string>
  formError?: string
  needsEmailConfirmation?: boolean
  values?: {
    fullName?: string
    companyName?: string
    email?: string
  }
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
  values: SignUpValues
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

  return {
    values: { fullName, companyName, email, password },
    errors,
  }
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

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      fieldErrors: errors,
      values: {
        fullName: values.fullName,
        companyName: values.companyName,
        email: values.email,
      },
    }
  }

  const { fullName, companyName, email, password } = values

  let anonClient: Awaited<ReturnType<typeof createServerSupabase>>
  let serviceClient: SupabaseClient

  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    anonClient = await createServerSupabase()
    serviceClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error('Supabase configuration error:', error)
    return {
      success: false,
      formError: 'Server configuration error. Please try again later.',
      values: {
        fullName,
        companyName,
        email,
      },
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
      values: {
        fullName,
        companyName,
        email,
      },
    }
  }

  let user = signUpData.user
  let session = signUpData.session

  // If email confirmation is on, session may be null. Try immediate sign-in.
  if (!session) {
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Supabase signIn after signUp error:', signInError)
    }

    session = signInData?.session ?? null
    if (!user && signInData?.user) {
      user = signInData.user
    }
  }

  if (!user) {
    console.error('Supabase signUp/signIn returned no user object.')
    return {
      success: false,
      formError: 'Unable to create account. Please try again.',
      values: {
        fullName,
        companyName,
        email,
      },
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
      values: {
        fullName,
        companyName,
        email,
      },
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
      values: {
        fullName,
        companyName,
        email,
      },
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
      values: {
        fullName,
        companyName,
        email,
      },
    }
  }

  if (session) {
    redirect('/dashboard')
  }

  return {
    success: true,
    needsEmailConfirmation: true,
    values: {
      fullName,
      companyName,
      email,
    },
  }
}
