import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@hire-io/utils'

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ])
}

export async function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl) {
    throw new Error('Supabase environment variable NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Supabase anon key is not configured (checked NEXT_PUBLIC_SUPABASE_ANON_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)'
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set(name, value, options)
      },
      remove(name, options) {
        cookieStore.set(name, '', {
          ...options,
          expires: new Date(0),
        })
      },
    },
  })
}

export async function getServerUser() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return { user: null }
  }

  return { user: data?.user ?? null }
}
