import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@hire-io/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

type UserProfile = {
  role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
  tenant_id: string | null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next()

  const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value
      },
      set(name, value, options) {
        response.cookies.set(name, value, options)
      },
      remove(name, options) {
        response.cookies.set(name, '', {
          ...options,
          expires: new Date(0),
        })
      },
    },
  })

  const clearSbCookies = () => {
    const allCookies = new Set([
      ...request.cookies.getAll().map((c) => c.name),
      ...response.cookies.getAll().map((c) => c.name),
    ])
    allCookies.forEach((name) => {
      if (name.startsWith('sb-')) {
        response.cookies.set(name, '', { path: '/', expires: new Date(0) })
      }
    })
  }

  const redirectWithCookies = (url: URL | string) => {
    const redirectUrl = typeof url === 'string' ? new URL(url, request.url) : url
    const redirectResponse = NextResponse.redirect(redirectUrl)

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        domain: cookie.domain,
      })
    })

    return redirectResponse
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/client') || pathname.startsWith('/candidate')) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))
      if (userError) {
        console.warn('[auth] middleware getUser error', { path: pathname, hasSbCookie, message: userError.message })
        clearSbCookies()
        return redirectWithCookies('/sign-in?reason=session_expired')
      }

      if (!user) {
        console.warn('[auth] middleware no-user', { path: pathname, hasSbCookie })
        return redirectWithCookies('/sign-in?reason=unauthorized')
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single<UserProfile>()

      if (!userProfile) {
        console.warn('[auth] middleware no-profile', { path: pathname, userId: user.id })
        return redirectWithCookies('/sign-in?reason=unauthorized')
      }

      if (pathname.startsWith('/dashboard')) {
        if (userProfile.role !== 'admin' && userProfile.role !== 'recruiter') {
          if (userProfile.role === 'client') {
            return redirectWithCookies('/client')
          }
          if (userProfile.role === 'candidate') {
            return redirectWithCookies('/candidate')
          }
          return redirectWithCookies('/sign-in')
        }
      }

      if (pathname.startsWith('/client')) {
        if (userProfile.role !== 'client') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return redirectWithCookies('/dashboard')
          }
          return redirectWithCookies('/sign-in')
        }
      }

      if (pathname.startsWith('/candidate')) {
        if (userProfile.role !== 'candidate') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return redirectWithCookies('/dashboard')
          }
          return redirectWithCookies('/sign-in')
        }
      }

      response.headers.set('x-user-id', user.id)
      if (userProfile.tenant_id) {
        response.headers.set('x-tenant-id', userProfile.tenant_id)
      } else {
        response.headers.delete('x-tenant-id')
      }
      response.headers.set('x-user-role', userProfile.role)

      return response
    } catch (error) {
      console.error('[auth] middleware error', error)
      clearSbCookies()
      return redirectWithCookies('/sign-in?reason=session_expired')
    }
  }

  // Allow auth routes to render without auto-redirect loops
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.warn('[auth] sign-in path userError', { message: userError.message })
        clearSbCookies()
      } else if (user) {
        // Do not auto-redirect; page can render a signed-in hint.
        console.info('[auth] sign-in path authed', { userId: user.id })
      }
    } catch (error) {
      console.error('[auth] sign-in path error', error)
      clearSbCookies()
    }
    return response
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/candidate/:path*', '/sign-in', '/sign-up'],
}
