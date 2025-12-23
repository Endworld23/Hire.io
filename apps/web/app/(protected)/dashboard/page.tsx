import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { createServerSupabase } from '@/lib/supabase-server'

type DashboardData = {
  user?: any
  tenant?: any
  jobs: any[]
  candidates: any[]
  applications: any[]
  authError?: string
  dataErrors: string[]
}

type DashboardUserProfile = {
  id: string
  full_name?: string | null
  role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
  tenant_id?: string | null
  tenant?: any
}

async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[dashboard] getUser error', { message: userError.message })
    return { jobs: [], candidates: [], applications: [], dataErrors: [], authError: 'Session error. Please sign in again.' }
  }

  if (!user) {
    return { jobs: [], candidates: [], applications: [], dataErrors: [], authError: 'Session missing. Please sign in again.' }
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*, tenant:tenants(*)')
    .eq('id', user.id)
    .single<DashboardUserProfile>()

  if (profileError || !userProfile) {
    console.warn('[dashboard] profile error', { message: profileError?.message, userId: user.id })
    return { jobs: [], candidates: [], applications: [], dataErrors: [], authError: 'Profile unavailable. Please sign in again.' }
  }

  if (!userProfile.tenant_id) {
    console.warn('[dashboard] missing tenant', { userId: user.id })
    return { jobs: [], candidates: [], applications: [], dataErrors: [], authError: 'Profile missing tenant. Please sign in again.' }
  }

  const dataErrors: string[] = []

  const [{ data: jobs, error: jobsError }, { data: candidates, error: candidatesError }, { data: applications, error: applicationsError }] =
    await Promise.all([
      supabase
        .from('jobs')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('candidates')
        .select('*')
        .eq('owner_tenant_id', userProfile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('applications')
        .select('*')
        .eq('tenant_id', userProfile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  if (jobsError) {
    console.warn('[dashboard] jobs error', { message: jobsError.message })
    dataErrors.push(`Jobs: ${jobsError.message}`)
  }
  if (candidatesError) {
    console.warn('[dashboard] candidates error', { message: candidatesError.message })
    dataErrors.push(`Candidates: ${candidatesError.message}`)
  }
  if (applicationsError) {
    console.warn('[dashboard] applications error', { message: applicationsError.message })
    dataErrors.push(`Applications: ${applicationsError.message}`)
  }

  return {
    user: userProfile,
    tenant: userProfile.tenant,
    jobs: jobs || [],
    candidates: candidates || [],
    applications: applications || [],
    dataErrors,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (data.authError || !data.user) {
    return (
      <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Session problem — please sign in again.</p>
        {data.authError ? <p className="text-sm">{data.authError}</p> : null}
        <Link className="text-sm font-medium text-blue-700 underline" href="/sign-in">
          Go to sign-in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {data.dataErrors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="font-semibold">Some data could not be loaded:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {data.dataErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {data.tenant?.name || 'Hire.io'}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back! Here&apos;s an overview of your hiring activity.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>
            {data.user.full_name} ({data.user.role})
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Active Jobs</dt>
                  <dd className="text-2xl font-semibold text-slate-900">
                    {data.jobs.filter((j: any) => j.status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Total Candidates</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{data.candidates.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-purple-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Applications</dt>
                  <dd className="text-2xl font-semibold text-slate-900">{data.applications.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-slate-900">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Create Job
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
            Add Candidate
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
            Invite User
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            View Analytics
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Phase 1 MVP - Authentication Complete</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                バ" Multi-tenant architecture operational<br />
                バ" Role-based access control active<br />
                バ" Next: Job Requisition Builder (Phase 1, Step 2)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
