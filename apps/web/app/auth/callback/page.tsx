'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@hire-io/utils'

function parseHashTokens(hash: string) {
  if (!hash.startsWith('#')) return {}
  const params = new URLSearchParams(hash.slice(1))
  const access_token = params.get('access_token') ?? undefined
  const refresh_token = params.get('refresh_token') ?? undefined
  const expires_in = params.get('expires_in')
  const type = params.get('type') ?? undefined
  const expiresInNumber = expires_in ? Number(expires_in) : undefined
  return { access_token, refresh_token, expires_in: expiresInNumber, type }
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { access_token, refresh_token } = parseHashTokens(window.location.hash)

    if (!access_token || !refresh_token || !supabaseUrl || !supabaseAnonKey) {
      router.replace('/sign-in?error=auth_callback_failed')
      return
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
      },
    })

    supabase.auth
      .setSession({
        access_token,
        refresh_token,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Auth callback setSession error:', error)
          router.replace('/sign-in?error=auth_callback_failed')
          return
        }

        // Clear tokens from the address bar
        window.history.replaceState(null, '', window.location.pathname)
        router.replace('/dashboard')
      })
      .catch((error) => {
        console.error('Auth callback unexpected error:', error)
        router.replace('/sign-in?error=auth_callback_failed')
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white px-6 py-8 shadow-md">
        <p className="text-sm text-gray-700">Finalizing sign-in...</p>
      </div>
    </div>
  )
}
