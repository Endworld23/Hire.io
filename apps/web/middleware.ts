import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseClient } from '@hire-io/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const accessToken = request.cookies.get('sb-access-token')?.value

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/client') || pathname.startsWith('/candidate')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)

      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

      if (userError || !user) {
        const response = NextResponse.redirect(new URL('/sign-in', request.url))
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        return response
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
      }

      if (pathname.startsWith('/dashboard')) {
        if (userProfile.role !== 'admin' && userProfile.role !== 'recruiter') {
          if (userProfile.role === 'client') {
            return NextResponse.redirect(new URL('/client', request.url))
          }
          if (userProfile.role === 'candidate') {
            return NextResponse.redirect(new URL('/candidate', request.url))
          }
          return NextResponse.redirect(new URL('/sign-in', request.url))
        }
      }

      if (pathname.startsWith('/client')) {
        if (userProfile.role !== 'client') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
          return NextResponse.redirect(new URL('/sign-in', request.url))
        }
      }

      if (pathname.startsWith('/candidate')) {
        if (userProfile.role !== 'candidate') {
          if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
          return NextResponse.redirect(new URL('/sign-in', request.url))
        }
      }

      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-tenant-id', userProfile.tenant_id)
      response.headers.set('x-user-role', userProfile.role)

      return response
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (accessToken) {
      try {
        const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)
        const { data: { user } } = await supabase.auth.getUser(accessToken)

        if (user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

          if (userProfile) {
            if (userProfile.role === 'admin' || userProfile.role === 'recruiter') {
              return NextResponse.redirect(new URL('/dashboard', request.url))
            } else if (userProfile.role === 'client') {
              return NextResponse.redirect(new URL('/client', request.url))
            } else if (userProfile.role === 'candidate') {
              return NextResponse.redirect(new URL('/candidate', request.url))
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/candidate/:path*', '/sign-in', '/sign-up'],
}
