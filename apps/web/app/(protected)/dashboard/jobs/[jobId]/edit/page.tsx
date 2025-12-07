import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getJobForEdit } from '@/lib/actions/jobs'
import { JobEditForm } from './job-edit-form'
import { archiveJobAction } from '../job-actions'
import { contractTypeSchema, type ContractType } from '@hire-io/schemas'

type PageProps = {
  params: {
    jobId: string
  }
}

export default async function JobEditPage({ params }: PageProps) {
  const job = await getJobForEdit(params.jobId)

  if (!job) {
    notFound()
  }

  const contractType: ContractType | '' = contractTypeSchema.options.includes(job.contractType as ContractType)
    ? (job.contractType as ContractType)
    : ''

  const initialValues = {
    title: job.title,
    description: job.description,
    location: job.location,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    screeningQuestions: job.screeningQuestions,
    salaryMin: job.salaryMin?.toString() || '',
    salaryMax: job.salaryMax?.toString() || '',
    hourlyRateMin: job.hourlyRateMin?.toString() || '',
    hourlyRateMax: job.hourlyRateMax?.toString() || '',
    contractType,
    intakeSummary: job.intakeSummary || '',
    idealCandidateProfile: job.idealCandidateProfile || '',
    aiSuggestedQuestionsText: job.aiSuggestedQuestions.join('\n'),
    status: job.status,
  }

  const archiveAction = archiveJobAction.bind(null, job.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-600">Job Settings</p>
              <h1 className="text-3xl font-semibold text-gray-900">Edit Job</h1>
              <p className="text-sm text-gray-500">
                Updating fields applies immediately for internal recruiters and client shortlists.
              </p>
            </div>
            {!job.status || job.status !== 'archived' ? (
              <form action={archiveAction}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Archive Job
                </button>
              </form>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                Archived
              </span>
            )}
          </div>

          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Job Detail
          </Link>

          <JobEditForm jobId={job.id} initialValues={initialValues} />
        </div>
      </div>
    </div>
  )
}
