import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { hasUser: false, hasProfile: false, error: userError?.message },
      { status: 200 }
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, tenant_id, role, email')
    .eq('id', user.id)
    .single()

  return NextResponse.json(
    {
      hasUser: true,
      hasProfile: Boolean(profile),
      profile: profile
        ? {
            id: (profile as any).id,
            tenantId: (profile as any).tenant_id,
            role: (profile as any).role,
            email: (profile as any).email,
          }
        : null,
      error: profileError?.message,
    },
    { status: 200 }
  )
}
