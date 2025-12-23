import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase()
  const path = req.nextUrl.pathname
  const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith('sb-'))

  const userResult = await supabase.auth.getUser()
  const user = userResult.data?.user || null
  const userError = userResult.error

  let profile: any = null
  let profileError: string | null = null
  if (user) {
    const { data, error } = await supabase
      .from('users')
      .select('id, tenant_id, role, email')
      .eq('id', user.id)
      .single()
    profile = data
    profileError = error?.message || null
  }

  let decision: string
  if (userError) {
    decision = 'redirect_sign_in_session_expired'
  } else if (!user) {
    decision = 'redirect_sign_in_unauthorized'
  } else if (profileError) {
    decision = 'redirect_sign_in_profile_error'
  } else if (!profile || !profile.tenant_id) {
    decision = 'redirect_onboarding_missing_profile'
  } else {
    decision = 'allow'
  }

  return NextResponse.json({
    path,
    hasSbCookie,
    getUser: {
      ok: !userError,
      error: userError?.message || null,
      userId: user?.id || null,
    },
    profile: {
      ok: Boolean(profile && (profile as any).tenant_id),
      error: profileError,
      tenantId: (profile as any)?.tenant_id || null,
      role: (profile as any)?.role || null,
    },
    decision,
  })
}
