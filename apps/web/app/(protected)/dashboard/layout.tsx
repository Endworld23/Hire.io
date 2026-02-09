import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/sign-in')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.tenant_id) {
    redirect('/onboarding?reason=missing_profile')
  }

  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    if (profile.role === 'client') {
      redirect('/client')
    }
    if (profile.role === 'candidate') {
      redirect('/candidate')
    }
    redirect('/sign-in')
  }

  return children
}
