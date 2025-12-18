import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return NextResponse.json({ hasUser: false, error: error.message }, { status: 200 })
  }

  const user = data?.user ?? null
  return NextResponse.json(
    { hasUser: Boolean(user), userId: user?.id },
    { status: 200 }
  )
}
