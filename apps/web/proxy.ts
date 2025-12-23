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
  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))

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

  const setAuthHeaders = (res: NextResponse, reason: string, hasCookie: boolean) => {
    res.headers.set('x-auth-redirect-reason', reason)
    res.headers.set('x-auth-path', pathname)
    res.headers.set('x-auth-has-sb-cookie', String(hasCookie))
    return res
  }

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

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/client') ||
    pathname.startsWith('/candidate')
  const isAuthRoute =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/auth/callback')
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'

  if (isStaticAsset) {
    return response
  }

  if (isProtected) {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.warn('[auth] middleware getUser error', { path: pathname, hasSbCookie, message: userError.message })
        clearSbCookies()
        return setAuthHeaders(
          redirectWithCookies('/sign-in?reason=session_expired'),
          'getUser_error',
          hasSbCookie
        )
      }

      if (!user) {
        console.warn('[auth] middleware no-user', { path: pathname, hasSbCookie })
        return setAuthHeaders(
          redirectWithCookies('/sign-in?reason=unauthorized'),
          'no_user',
          hasSbCookie
        )
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single<UserProfile>()

      if (profileError || !userProfile || !userProfile.tenant_id) {
        console.warn('[auth] middleware missing-profile', {
          path: pathname,
          userId: user.id,
          message: profileError?.message,
        })
        return setAuthHeaders(
          redirectWithCookies('/onboarding?reason=missing_profile'),
          profileError ? 'profile_error' : 'tenant_missing',
          hasSbCookie
        )
      }

      if (pathname.startsWith('/dashboard')) {
        if (userProfile.role !== 'admin' && userProfile.role !== 'recruiter') {
          if (userProfile.role === 'client') {
            return setAuthHeaders(redirectWithCookies('/client'), 'role_redirect_client', hasSbCookie)
          }
          if (userProfile.role === 'candidate') {
            return setAuthHeaders(redirectWithCookies('/candidate'), 'role_redirect_candidate', hasSbCookie)
          }
          return setAuthHeaders(redirectWithCookies('/sign-in'), 'unauthorized_role', hasSbCookie)
        }
      }

      if (pathname.startsWith('/client')) {
        if (userProfile.role !== 'client') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return setAuthHeaders(redirectWithCookies('/dashboard'), 'role_redirect_dashboard', hasSbCookie)
          }
          return setAuthHeaders(redirectWithCookies('/sign-in'), 'unauthorized_role', hasSbCookie)
        }
      }

      if (pathname.startsWith('/candidate')) {
        if (userProfile.role !== 'candidate') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return setAuthHeaders(redirectWithCookies('/dashboard'), 'role_redirect_dashboard', hasSbCookie)
          }
          return setAuthHeaders(redirectWithCookies('/sign-in'), 'unauthorized_role', hasSbCookie)
        }
      }

      response.headers.set('x-user-id', user.id)
      if (userProfile.tenant_id) {
        response.headers.set('x-tenant-id', userProfile.tenant_id)
      } else {
        response.headers.delete('x-tenant-id')
      }
      response.headers.set('x-user-role', userProfile.role)
      response.headers.set('x-auth-allowed', 'true')
      response.headers.set('x-auth-path', pathname)
      response.headers.set('x-auth-has-sb-cookie', String(hasSbCookie))
      response.headers.set('x-auth-user', user.id.slice(0, 8))

      return response
    } catch (error) {
      console.error('[auth] middleware error', error)
      clearSbCookies()
      return setAuthHeaders(
        redirectWithCookies('/sign-in?reason=session_expired'),
        'getUser_error',
        request.cookies.getAll().some((c) => c.name.startsWith('sb-'))
      )
    }
  }

  // Allow auth/onboarding routes to render without auto-redirect loops
  if (isAuthRoute) {
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
  matcher: ['/dashboard/:path*', '/client/:path*', '/candidate/:path*', '/sign-in', '/sign-up', '/onboarding', '/auth/callback'],
}
