'use server'

import { createServerSupabase, withTimeout } from '@/lib/supabase-server'

type SignInResult = {
  success: boolean
  formError?: string
  needsEmailConfirmation?: boolean
  resendSent?: boolean
  values?: {
    email?: string
  }
}

function validateSignIn(formData: FormData): {
  email: string
  password: string
  errors: Record<string, string>
} {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const errors: Record<string, string> = {}
  if (!email) {
    errors.email = 'Email is required.'
  } else if (!email.includes('@')) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  }

  return { email, password, errors }
}

export async function signInWithPassword(formData: FormData): Promise<SignInResult> {
  const { email, password, errors } = validateSignIn(formData)

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      formError: errors.email ?? errors.password,
      values: { email },
    }
  }

  console.log('[sign-in] start')

  let data
  let error
  try {
    const supabase = await createServerSupabase()
    console.log('[sign-in] calling supabase')
    const result = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      10_000,
      'signInWithPassword'
    )
    data = result.data
    error = result.error
    if (error) {
      console.log('[sign-in] error', error)
    } else {
      console.log('[sign-in] success')
    }
  } catch (err: unknown) {
    console.error('[sign-in] error', err)
    return {
      success: false,
      formError:
        err instanceof Error ? err.message : 'Unexpected error during sign-in. Please try again.',
      values: { email },
    }
  }

  if (error) {
    const message = error.message || 'Unable to sign in.'
    const notConfirmed =
      message.toLowerCase().includes('confirm') || message.toLowerCase().includes('not confirmed')
    return {
      success: false,
      formError: notConfirmed
        ? 'Email not confirmed. Please check your inbox.'
        : message,
      needsEmailConfirmation: notConfirmed,
      values: { email },
    }
  }

  if (!data.session) {
    return {
      success: false,
      formError: 'No session created. Please try again.',
      values: { email },
    }
  }

  return { success: true }
}

export async function resendConfirmationEmail(formData: FormData): Promise<SignInResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return {
      success: false,
      formError: 'Email is required.',
      values: { email },
    }
  }

  const supabase = await createServerSupabase()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    console.error('Resend confirmation error:', error)
    return {
      success: false,
      formError: error.message ?? 'Unable to resend confirmation email.',
      values: { email },
    }
  }

  return {
    success: true,
    resendSent: true,
    values: { email },
  }
}
