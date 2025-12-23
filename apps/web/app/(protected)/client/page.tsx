import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { createServerSupabase } from '@/lib/supabase-server'

type ClientData = {
  user?: any
  tenant?: any
  error?: string
}

type ClientUserProfile = {
  id: string
  full_name?: string | null
  role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
  tenant?: any
}

async function getClientData(): Promise<ClientData> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[client] getUser error', { message: userError.message })
    return { error: 'Session error. Please sign in again.' }
  }

  if (!user) {
    return { error: 'Session missing. Please sign in again.' }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*, tenant:tenants(*)')
    .eq('id', user.id)
    .single<ClientUserProfile>()

  if (profileError || !userProfile || userProfile.role !== 'client') {
    console.warn('[client] profile error', { message: profileError?.message, userId: user.id })
    return { error: 'Profile unavailable for client role.' }
  }

  return {
    user: userProfile,
    tenant: userProfile.tenant,
  }
}

export default async function ClientPage() {
  const data = await getClientData()

  if (data.error || !data.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <p className="font-semibold">Session problem — please sign in again.</p>
            {data.error ? <p className="text-sm">{data.error}</p> : null}
            <Link className="text-sm font-medium text-blue-700 underline" href="/sign-in">
              Go to sign-in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {data.tenant?.name || 'Hire.io'} - Client Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {data.user.full_name}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Client Portal</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review candidates and provide feedback on your job openings.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">EEO-Blind Candidate Shortlists</h3>
            <p className="text-gray-600">
              Your anonymized candidate shortlists will appear here. All candidate information is
              presented without personal identifiable information to ensure fair and unbiased review.
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-500 italic">
                Reference: /docs/security-and-eeo.md - Section 1.1 (EEO-Blind Mode)
              </p>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Phase 1 - Client Portal Ready</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    ✓ EEO-blind architecture in place<br />
                    ✓ Role-based access enforced<br />
                    Next: EEO-Blind Shortlist UI (Phase 1, Module 3)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
