import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

function parseCookieNames(cookieHeader: string | null): string[] {
  if (!cookieHeader) return []
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split('=')[0] || '')
    .filter(Boolean)
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie')
  const cookieNames = parseCookieNames(cookieHeader)
  const sbCookieNames = cookieNames.filter((name) => name.startsWith('sb-'))

  if (sbCookieNames.length === 0) {
    return NextResponse.json(
      { hasUser: false, error: 'No Supabase cookies found on request', sbCookieNames },
      { status: 200 }
    )
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return NextResponse.json(
      { hasUser: false, error: error.message, sbCookieNames },
      { status: 200 }
    )
  }

  const user = data?.user ?? null
  return NextResponse.json(
    { hasUser: Boolean(user), userId: user?.id, sbCookieNames },
    { status: 200 }
  )
}
