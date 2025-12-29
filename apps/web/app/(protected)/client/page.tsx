import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import { addApplicationFeedback } from '@/lib/actions/applications'
import { createServerSupabase } from '@/lib/supabase-server'

type ClientData = {
  user?: any
  tenant?: any
  error?: string
  jobs?: ClientJob[]
  selectedJob?: ClientJob | null
  shortlist?: ShortlistItem[]
  shortlistError?: string | null
  feedbackByApplication?: Record<string, FeedbackEntry[]>
  feedbackError?: string | null
}

type ClientUserProfile = {
  id: string
  full_name?: string | null
  role: 'super_admin' | 'admin' | 'recruiter' | 'client' | 'candidate'
  tenant_id?: string | null
  tenant?: any
}

type ClientJob = {
  id: string
  title: string
  status: string | null
}

type ShortlistItem = {
  application_id: string
  candidate_id: string
  candidate_public_id: string | null
  stage: string | null
  created_at: string
}

type FeedbackEntry = {
  id: string
  application_id: string
  rating: number | null
  comment: string
  created_at: string
  author_user_id: string | null
}

async function getClientData(jobId?: string): Promise<ClientData> {
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

  const tenantId = userProfile.tenant?.id ?? userProfile.tenant_id ?? null
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, status')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (jobsError) {
    console.warn('[client] jobs error', { message: jobsError.message, userId: user.id })
  }

  const selectedJob =
    jobId && jobs ? (jobs as ClientJob[]).find((job) => job.id === jobId) ?? null : null

  let shortlist: ShortlistItem[] = []
  let shortlistError: string | null = null
  let feedbackByApplication: Record<string, FeedbackEntry[]> = {}
  let feedbackError: string | null = null

  if (selectedJob) {
    const { data: shortlistRows, error: shortlistLoadError } = await (supabase as any).rpc(
      'client_job_shortlist',
      {
        p_job_id: selectedJob.id,
      },
    )
    if (shortlistLoadError) {
      console.warn('[client] shortlist error', { message: shortlistLoadError.message, jobId: selectedJob.id })
      shortlistError = shortlistLoadError.message
    } else {
      shortlist = (shortlistRows as ShortlistItem[]) || []
    }

    const { data: feedbackRows, error: feedbackLoadError } = await supabase
      .from('job_application_feedback')
      .select('id, application_id, rating, comment, created_at, author_user_id')
      .eq('job_id', selectedJob.id)

    if (feedbackLoadError) {
      console.warn('[client] feedback error', { message: feedbackLoadError.message, jobId: selectedJob.id })
      feedbackError = feedbackLoadError.message
    } else {
      for (const row of (feedbackRows as FeedbackEntry[]) || []) {
        if (!feedbackByApplication[row.application_id]) {
          feedbackByApplication[row.application_id] = []
        }
        feedbackByApplication[row.application_id].push(row)
      }
    }
  }

  return {
    user: userProfile,
    tenant: userProfile.tenant,
    jobs: (jobs as ClientJob[]) || [],
    selectedJob,
    shortlist,
    shortlistError,
    feedbackByApplication,
    feedbackError,
  }
}

export default async function ClientPage({ searchParams }: { searchParams?: { jobId?: string } }) {
  const data = await getClientData(searchParams?.jobId)

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

          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">EEO-Blind Candidate Shortlists</h3>
              <p className="text-gray-600">
                Review anonymized candidates and leave feedback for your job openings.
              </p>
            </div>

            <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Job</label>
                <select
                  name="jobId"
                  defaultValue={data.selectedJob?.id ?? ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a job</option>
                  {(data.jobs || []).map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Load shortlist
              </button>
            </form>

            {!data.selectedJob && (
              <p className="text-sm text-gray-500">
                Choose a job to view its anonymized shortlist.
              </p>
            )}

            {data.shortlistError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {data.shortlistError}
              </div>
            )}
            {data.feedbackError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {data.feedbackError}
              </div>
            )}

            {data.selectedJob && (
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Candidate ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Stage
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Feedback
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(data.shortlist || []).length === 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>
                          No applications yet for this job.
                        </td>
                      </tr>
                    ) : (
                      (data.shortlist || []).map((item) => (
                        <tr key={item.application_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.candidate_public_id || item.candidate_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.stage || 'applied'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <form action={addApplicationFeedback} className="space-y-2">
                              <input type="hidden" name="applicationId" value={item.application_id} />
                              <input type="hidden" name="jobId" value={data.selectedJob?.id || ''} />
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600">Rating</label>
                                  <select
                                    name="rating"
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                                    defaultValue=""
                                  >
                                    <option value="">Optional</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600">Comment</label>
                                  <input
                                    name="comment"
                                    required
                                    minLength={3}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
                                    placeholder="Add feedback..."
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                  Submit
                                </button>
                              </div>
                            </form>
                            {(data.feedbackByApplication?.[item.application_id] || []).length > 0 && (
                              <div className="mt-3 space-y-2 text-xs text-gray-600">
                                {(data.feedbackByApplication?.[item.application_id] || []).map((entry) => (
                                  <div key={entry.id} className="rounded border border-gray-200 bg-gray-50 p-2">
                                    <div className="flex items-center justify-between text-gray-500">
                                      <span>
                                        {entry.rating ? `Rating: ${entry.rating}` : 'No rating'}
                                      </span>
                                      <span>
                                        {new Date(entry.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-gray-700">{entry.comment}</p>
                                    {entry.author_user_id === data.user?.id && (
                                      <p className="mt-1 text-[11px] text-gray-400">You submitted</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
