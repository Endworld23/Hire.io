import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@hire-io/utils'
import { envPublic } from '@/lib/env.public'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  let response = NextResponse.redirect(new URL('/dashboard', request.url))

  const supabase = createServerClient<Database>(envPublic.supabaseUrl, envPublic.supabasePublishableKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        response.cookies.set(name, value, options)
      },
      remove(name, options) {
        response.cookies.set(name, '', { ...options, expires: new Date(0) })
      },
    },
  })

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=auth_callback_failed', request.url))
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=auth_callback_failed', request.url))
  }

  return response
}
