import { cookies } from 'next/headers'
import { createSupabaseClient } from '@hire-io/utils'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

async function getCandidateData() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    redirect('/sign-in')
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseSecretKey) as any
  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user) {
    redirect('/sign-in')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'candidate') {
    redirect('/sign-in')
  }

  const { data: candidateProfile } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return {
    user: userProfile,
    candidate: candidateProfile,
  }
}

export default async function CandidatePage() {
  const data = await getCandidateData()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Hire.io - Candidate Portal
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
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your profile and view your applications.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
            {data.candidate ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{data.candidate.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{data.candidate.email}</p>
                </div>
                {data.candidate.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{data.candidate.location}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">
                No candidate profile found. Please complete your profile to start applying for jobs.
              </p>
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
                <h3 className="text-sm font-medium text-blue-800">Phase 1 - Candidate Portal Ready</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    ✓ Candidate profile access operational<br />
                    ✓ Role-based access enforced<br />
                    Next: Candidate Upload & Profile Builder (Phase 1, Module 2)
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
