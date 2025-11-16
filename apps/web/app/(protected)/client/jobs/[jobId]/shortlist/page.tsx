import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClientShortlist } from './shortlist-data'
import { ShortlistCardActions } from './shortlist-actions-client'
import { Badge } from '@/components/ui'

type PageProps = {
  params: {
    jobId: string
  }
}

export default async function ClientShortlistPage({ params }: PageProps) {
  const data = await getClientShortlist(params.jobId).catch(() => null)
  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-600">EEO-Blind Shortlist</p>
              <h1 className="text-3xl font-semibold text-gray-900">{data.job.title}</h1>
              <p className="text-sm text-gray-600">
                {data.job.location || 'Location flexible'}
                {data.job.employmentType ? ` • ${capitalize(data.job.employmentType)}` : null}
              </p>
            </div>
            <Link
              href="/client"
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ← Back to client home
            </Link>
          </header>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Role Snapshot</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Key Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.job.requiredSkills.length === 0 && (
                    <span className="text-sm text-gray-500">No skills specified</span>
                  )}
                  {data.job.requiredSkills.slice(0, 6).map(skill => (
                    <Badge key={skill} variant="muted">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Nice to Have</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.job.niceToHave.length === 0 && (
                    <span className="text-sm text-gray-500">None listed</span>
                  )}
                  {data.job.niceToHave.slice(0, 6).map(skill => (
                    <Badge key={skill} variant="muted">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Candidates</h2>
                <p className="text-sm text-gray-600">
                  Aliases, skills, and experience only. No PII is ever displayed per /docs/security-and-eeo.md.
                </p>
              </div>
              <p className="text-sm text-gray-500">Click Shortlist or Remove to provide feedback.</p>
            </div>

            {data.candidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                No candidates are available yet. Recruiters will populate this shortlist once profiles are ready.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.candidates.map(candidate => (
                  <article
                    key={candidate.applicationId}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:ring-blue-100"
                    aria-label={`Candidate ${candidate.alias}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{candidate.alias}</p>
                        <p className="text-xs text-gray-500">{candidate.experienceLabel}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          candidate.stage === 'shortlisted'
                            ? 'bg-green-100 text-green-800'
                            : candidate.stage === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {candidate.stageLabel}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.skills.map(skill => (
                        <Badge key={`${candidate.applicationId}-${skill}`} variant="muted">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Match score</p>
                        <p className="text-base font-semibold text-gray-900">{candidate.matchScore}%</p>
                      </div>
                      <ShortlistCardActions
                        applicationId={candidate.applicationId}
                        jobId={data.job.id}
                        currentStage={candidate.stage}
                      />
                    </div>
                    {candidate.notes && (
                      <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{candidate.notes}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function capitalize(value: string | null | undefined) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}
