'use server'

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@hire-io/utils'

type SignInResult = {
  success: boolean
  formError?: string
  needsEmailConfirmation?: boolean
  resendSent?: boolean
  values?: {
    email?: string
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getAnonClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
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

  let supabase
  try {
    supabase = getAnonClient()
  } catch (error) {
    console.error('Supabase configuration error:', error)
    return {
      success: false,
      formError: 'Server configuration error. Please try again later.',
      values: { email },
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

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

  redirect('/dashboard')
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

  let supabase
  try {
    supabase = getAnonClient()
  } catch (error) {
    console.error('Supabase configuration error:', error)
    return {
      success: false,
      formError: 'Server configuration error. Please try again later.',
      values: { email },
    }
  }

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
