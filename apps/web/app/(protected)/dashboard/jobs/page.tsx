import Link from 'next/link'
import { listJobs } from '@/lib/actions/jobs'

type JobsPageProps = {
  searchParams?: {
    created?: string
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { jobs, error } = await listJobs()
  const jobCreated = searchParams?.created === '1'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Openings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your job postings and track applications.
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Job
        </Link>
      </div>

      {jobCreated && !error && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Job created successfully. Recruiters can now add candidates to the pipeline.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No jobs yet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Get started by creating your first job opening.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <ul className="divide-y divide-slate-200">
            {jobs.map((job: any) => {
              const jobId = job?.id
              if (!jobId) {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('[jobs] missing job.id in list item', job)
                }
              }
              const editHref = jobId ? `/dashboard/jobs/${jobId}/edit` : undefined
              return (
                <li key={jobId || job?.title || Math.random()}>
                  {editHref ? (
                    <Link
                      href={editHref}
                      className="block cursor-pointer transition hover:bg-slate-50"
                    >
                      <JobRow job={job} editHref={editHref} />
                    </Link>
                  ) : (
                    <div className="block transition hover:bg-slate-50">
                      <JobRow job={job} editHref={undefined} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Phase 1, Module 2: Job Builder</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Reference: /docs/roadmap.md (lines 104-107)<br />
                Create job openings with AI-assisted intake
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JobRow({ job, editHref }: { job: any; editHref?: string }) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center">
          <div>
            <div className="flex items-center">
              <p className="truncate text-lg font-medium text-blue-600">{job.title}</p>
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  job.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : job.status === 'draft'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {job.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {job.location || 'Location not specified'}
              </span>
              <span className="text-slate-300">|</span>
              <span>
                {new Date(job.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {job.required_skills && Array.isArray(job.required_skills) && job.required_skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {job.required_skills.slice(0, 5).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 5 && (
                  <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                    +{job.required_skills.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="ml-5 flex flex-shrink-0 items-center space-x-4">
          {editHref && (
            <span className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
              Edit
            </span>
          )}
          {editHref && (
            <span
              className="flex h-5 w-5 items-center justify-center text-slate-400"
              aria-hidden="true"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
