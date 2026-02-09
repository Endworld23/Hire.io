import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@hire-io/utils'
import { envPublic } from '@/lib/env.public'

export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ])
}

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(envPublic.supabaseUrl, envPublic.supabasePublishableKey, {
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
