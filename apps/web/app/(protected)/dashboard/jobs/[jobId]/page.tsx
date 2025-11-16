import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getJob, getJobMetrics } from '@/lib/actions/jobs'
import { Badge } from '@/components/ui'
import { AddCandidateDialog } from './add-candidate-dialog'
import { AddFeedbackDialog } from './add-feedback-dialog'
import { archiveJobAction } from './job-actions'
import { updateApplicationStageAction } from './application-actions'

type JobApplication = {
  id: string
  stage: string
  score: number | null
  match_score?: number | null
  notes: string | null
  created_at: string
  feedback?: Array<{
    id: string
    rating: number | null
    comment: string
    created_at: string
    author?: {
      full_name: string | null
    } | null
  }>
  candidate?: {
    id: string
    full_name: string
    skills?: string[]
    experience?: { yearsOfExperience?: number }
    resume_url?: string
  }
}

const pipelineStages = [
  { id: 'new', name: 'New', description: 'Recently added candidates pending review' },
  { id: 'applied', name: 'Applied', description: 'Applications submitted awaiting review' },
  { id: 'recruiter_screen', name: 'Recruiter Screen', description: 'Initial qualification and assessment' },
  { id: 'screening', name: 'Screening', description: 'Phone screen or assessment' },
  { id: 'submitted_to_client', name: 'Submitted to Client', description: 'Shared with client for review' },
  { id: 'client_shortlisted', name: 'Client Shortlisted', description: 'Approved by the client shortlist' },
  { id: 'client_rejected', name: 'Client Archived', description: 'Removed by the client' },
  { id: 'interview', name: 'Interview', description: 'Hiring manager & panel interviews' },
  { id: 'offer', name: 'Offer', description: 'Offer discussions & negotiation' },
  { id: 'hired', name: 'Hired', description: 'Accepted offers and onboarding' },
  { id: 'rejected', name: 'Archived', description: 'Declined or not moving forward' },
]

const stageOptions = [
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'recruiter_screen', label: 'Recruiter Screen' },
  { value: 'screening', label: 'Screening' },
  { value: 'submitted_to_client', label: 'Submitted to Client' },
  { value: 'client_shortlisted', label: 'Client Shortlisted' },
  { value: 'client_rejected', label: 'Client Rejected' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
]

type JobDetailPageProps = {
  params: {
    jobId: string
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  // Phase 1 – Core ATS – Job Detail + Pipeline Shell
  const [job, metrics] = await Promise.all([getJob(params.jobId), getJobMetrics(params.jobId)])

  if (!job) {
    notFound()
  }

  const isArchived = job.status === 'archived'
  const archiveAction = archiveJobAction.bind(null, job.id)
  const compensation = job.spec?.compensation
  const applications = (job.applications || []) as JobApplication[]
  const pipelineWithCandidates = pipelineStages.map(stage => ({
    ...stage,
    applications: applications.filter(app => app.stage === stage.id),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold text-gray-900">{job.title}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    job.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'draft'
                      ? 'bg-gray-100 text-gray-800'
                      : job.status === 'archived'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Created {new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/dashboard/jobs/${job.id}/edit`}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Edit Job
              </Link>
              {!isArchived ? (
                <form action={archiveAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Archive
                  </button>
                </form>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                  Archived
                </span>
              )}
            </div>
          </div>

          {metrics && (
            <section className="bg-white shadow rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Job Overview</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500">Total Applications</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.totalApplications}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Average Match Score</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {metrics.averageMatchScore != null ? `${metrics.averageMatchScore}%` : '–'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Client Shortlisted</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.clientShortlistedCount}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Client Rejected</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.clientRejectedCount}</p>
                </div>
              </div>
              {Object.keys(metrics.byStage).length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applications by Stage</p>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(metrics.byStage).map(([stage, count]) => (
                      <div key={stage} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <dt className="text-xs font-semibold text-gray-500">{stageToLabel(stage)}</dt>
                        <dd className="text-xl font-semibold text-gray-900">{count}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          )}

          <section className="bg-white shadow rounded-xl border border-gray-100 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Role Overview</h2>
                <dl className="mt-3 space-y-3 text-sm text-gray-800">
                  <div>
                    <dt className="font-medium text-gray-600">Location</dt>
                    <dd>{job.location || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Employment Type</dt>
                    <dd>{job.spec?.employmentType || job.employment_type || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Experience Level</dt>
                    <dd>{job.spec?.experienceLevel || 'Not specified'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Compensation</h2>
                <dl className="mt-3 space-y-3 text-sm text-gray-800">
                  <div>
                    <dt className="font-medium text-gray-600">Salary Range</dt>
                    <dd>{formatCompRange(compensation?.salaryRange?.min, compensation?.salaryRange?.max)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Hourly Range</dt>
                    <dd>{formatCompRange(compensation?.hourlyRange?.min, compensation?.hourlyRange?.max)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Contract Type</dt>
                    <dd className="capitalize">
                      {compensation?.contractType ? compensation.contractType.replace('-', ' ') : 'Not specified'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Description</h2>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                {job.spec?.description || 'No description provided yet.'}
              </p>
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Candidate Pipeline</h2>
                <p className="text-sm text-gray-600">
                  Track anonymized candidates across each stage. Upload resumes to populate this board.
                </p>
              </div>
              <AddCandidateDialog jobId={job.id} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pipelineWithCandidates.map(stage => (
                <div key={stage.id} className="rounded-lg border border-dashed border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                      {stage.applications.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{stage.description}</p>
                  <div className="mt-3 space-y-3">
                    {stage.applications.length === 0 && (
                      <div className="rounded-md border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 text-center">
                        No candidates yet
                      </div>
                    )}
                    {stage.applications.map(application => (
                      <article
                        key={application.id}
                        className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-800"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">
                            {application.candidate?.full_name || 'Anonymized Candidate'}
                          </p>
                          <div className="flex items-center gap-3">
                            <StageActionMenu applicationId={application.id} currentStage={application.stage} />
                            <AddFeedbackDialog applicationId={application.id} jobId={job.id} />
                            <div className="text-right">
                              {application.match_score != null ? (
                                <>
                                  <p className="text-xs text-gray-500">Match score</p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    {Math.round(Number(application.match_score))}%
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs text-gray-500">Match pending</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Added{' '}
                          {new Date(application.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(Array.isArray(application.candidate?.skills)
                            ? application.candidate?.skills.slice(0, 4)
                            : []
                          ).map(skill => (
                            <Badge key={`${application.id}-${skill}`} variant="muted">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                          Experience:{' '}
                          {application.candidate?.experience?.yearsOfExperience != null
                            ? `${application.candidate?.experience?.yearsOfExperience}+ yrs`
                            : 'Not captured'}
                        </p>
                        {application.notes && (
                          <p className="mt-2 rounded bg-white/70 p-2 text-xs text-gray-600">{application.notes}</p>
                        )}
                        {application.feedback && application.feedback.length > 0 && (
                          <div className="mt-3 rounded-md border border-gray-200 bg-white p-2">
                            <p className="text-xs font-semibold text-gray-500">Feedback</p>
                            <ul className="mt-1 space-y-1">
                              {application.feedback.map(entry => (
                                <li key={entry.id} className="text-xs text-gray-700">
                                  <span className="font-semibold">
                                    {entry.author?.full_name || 'Internal reviewer'}
                                  </span>
                                  {entry.rating ? ` – ${entry.rating}/5` : null}
                                  <span className="text-gray-500">
                                    {' '}
                                    • {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <p className="text-gray-600">{entry.comment}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function formatCompRange(min?: number | null, max?: number | null) {
  if (!min && !max) return 'Not specified'
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  if (min) return `From $${min.toLocaleString()}`
  return `Up to $${max?.toLocaleString()}`
}

function StageActionMenu({ applicationId, currentStage }: { applicationId: string; currentStage: string }) {
  return (
    <details className="relative">
      <summary className="cursor-pointer rounded-full border border-gray-300 px-2 py-0.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
        ⋯
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-gray-100 bg-white p-3 shadow-lg ring-1 ring-black/5">
        <form action={updateApplicationStageAction} className="space-y-2">
          <input type="hidden" name="applicationId" value={applicationId} />
          <label className="text-xs font-semibold text-gray-500">Move to stage</label>
          <select
            name="stage"
            defaultValue={currentStage}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {stageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Update Stage
          </button>
        </form>
        <div className="mt-3 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-500">Quick actions</div>
        <div className="mt-2 space-y-2">
          <form action={updateApplicationStageAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="stage" value="hired" />
            <button
              type="submit"
              className="w-full rounded-md border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
            >
              Mark as Hired
            </button>
          </form>
          <form action={updateApplicationStageAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="stage" value="rejected" />
            <button
              type="submit"
              className="w-full rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Mark as Rejected
            </button>
          </form>
        </div>
      </div>
    </details>
  )
}

function stageToLabel(stage: string) {
  const map: Record<string, string> = {
    new: 'New',
    applied: 'Applied',
    recruiter_screen: 'Recruiter Screen',
    screening: 'Screening',
    submitted_to_client: 'Submitted to Client',
    client_shortlisted: 'Client Shortlisted',
    client_rejected: 'Client Rejected',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
  }
  return map[stage] || stage
}
