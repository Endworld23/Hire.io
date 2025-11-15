import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJob } from '@/lib/actions/jobs'

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    notFound()
  }

  const spec = job.spec as {
    description?: string
    employmentType?: string
    experienceLevel?: string
    screeningQuestions?: string[]
  } | null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard/jobs"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <div className="mt-1 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created {new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/dashboard/jobs/${job.id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Job Description</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {spec?.description || 'No description provided'}
                  </div>
                </div>
              </div>

              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(job.required_skills) && job.required_skills.length > 0 ? (
                      job.required_skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No required skills specified</p>
                    )}
                  </div>
                </div>
              </div>

              {Array.isArray(job.nice_to_have) && job.nice_to_have.length > 0 && (
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Preferred Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.nice_to_have.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {spec?.screeningQuestions && Array.isArray(spec.screeningQuestions) && spec.screeningQuestions.length > 0 && (
                <div className="bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Screening Questions</h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                      {spec.screeningQuestions.map((question: string, index: number) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Job Details</h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">{job.location || 'Not specified'}</dd>
                    </div>
                    {spec?.employmentType && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{spec.employmentType.replace('-', ' ')}</dd>
                      </div>
                    )}
                    {spec?.experienceLevel && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{spec.experienceLevel}</dd>
                      </div>
                    )}
                    {(job.salary_min || job.salary_max) && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Salary Range</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          ${job.salary_min?.toLocaleString() || '—'} - ${job.salary_max?.toLocaleString() || '—'}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Application Stats</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total Applications</span>
                      <span className="text-2xl font-bold text-gray-900">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">In Review</span>
                      <span className="text-lg font-semibold text-blue-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Interviewed</span>
                      <span className="text-lg font-semibold text-green-600">0</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/dashboard/jobs/${job.id}/applications`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all applications →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Next Steps</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Review and edit job details</li>
                        <li>Publish the job to start receiving applications</li>
                        <li>Share the job posting link</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
