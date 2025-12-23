'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Textarea, Button } from '@/components/ui'
import type { CreateJobInput, EmploymentType, ContractType } from '@hire-io/schemas'
import {
  loadJob,
  submitJobUpdate,
  loadApplications,
  loadCandidates,
  createJobApplication,
} from './actions'

type EditableJob = CreateJobInput & {
  id: string
  salaryMin?: number | null
  salaryMax?: number | null
  hourlyRateMin?: number | null
  hourlyRateMax?: number | null
  contractType?: ContractType | null
}

type ApplicationRow = {
  id: string
  candidate_id: string
  stage: string | null
  created_at: string
}

type CandidateOption = {
  id: string
  full_name?: string | null
  email?: string | null
}

export default function EditJobPage() {
  const router = useRouter()
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<EditableJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, startSubmitTransition] = useTransition()
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [appListError, setAppListError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<CandidateOption[]>([])
  const [candidateError, setCandidateError] = useState<string | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [isCreating, startCreateTransition] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    ;(async () => {
      const [data, applicationsResult, candidatesResult] = await Promise.all([
        loadJob(jobId),
        loadApplications(jobId),
        loadCandidates(),
      ])

      if (!data) {
        setError('Job not found or you are not authorized to edit this job.')
      } else {
        setJob({
          ...data,
          salaryMin: data.salaryMin ?? null,
          salaryMax: data.salaryMax ?? null,
          hourlyRateMin: data.hourlyRateMin ?? null,
          hourlyRateMax: data.hourlyRateMax ?? null,
          contractType: (data.contractType as ContractType | null) ?? null,
        } as EditableJob)
      }

      setApplications(applicationsResult.applications || [])
      if (applicationsResult.error) {
        setAppListError(applicationsResult.error)
      }

      setCandidates(candidatesResult.candidates || [])
      if (candidatesResult.error) {
        setCandidateError(candidatesResult.error)
      }

      setIsLoading(false)
    })()
  }, [jobId])

  const setField = (field: keyof EditableJob, value: any) => {
    setJob(prev => (prev ? { ...prev, [field]: value } : prev))
    setError(null)
  }

  const handleSubmit = () => {
    if (!job) return
    const payload: Partial<CreateJobInput> = {
      title: job.title,
      description: job.description,
      location: job.location,
      employmentType: job.employmentType as EmploymentType,
      requiredSkills: job.requiredSkills,
      preferredSkills: job.preferredSkills,
      salaryMin: toNumber(job.salaryMin),
      salaryMax: toNumber(job.salaryMax),
      hourlyRateMin: toNumber(job.hourlyRateMin),
      hourlyRateMax: toNumber(job.hourlyRateMax),
      contractType: job.contractType || undefined,
      status: job.status,
    }

    startSubmitTransition(async () => {
      const result = await submitJobUpdate(job.id, payload)
      if (!result?.success) {
        setError(result?.error || 'Unable to update job')
      }
    })
  }

  const handleCreateApplication = () => {
    if (!job || !job.id) return
    if (!selectedCandidateId) {
      setCreateError('Please select a candidate')
      return
    }
    setCreateError(null)
    startCreateTransition(async () => {
      const result = await createJobApplication(job.id, selectedCandidateId)
      if (!result || !('success' in result) || result.success === false) {
        setCreateError(result?.error || 'Unable to create application')
        return
      }
      setApplications(prev => [result.application, ...prev])
      setSelectedCandidateId('')
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded bg-slate-200" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Job not available</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'This job could not be loaded.'}</p>
        <Link href="/dashboard/jobs" className="mt-4 inline-flex text-sm font-semibold text-blue-600">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Edit Job</p>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-600">Job ID: {job.id}</p>
        </div>
        <Link href="/dashboard/jobs" className="text-sm font-semibold text-blue-600">
          Back to Jobs
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-slate-800">Title</label>
          <Input value={job.title} onChange={e => setField('title', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">Location</label>
          <Input value={job.location} onChange={e => setField('location', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-800">Salary Min</label>
            <Input
              type="number"
              value={job.salaryMin ?? ''}
              onChange={e => setField('salaryMin', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800">Salary Max</label>
            <Input
              type="number"
              value={job.salaryMax ?? ''}
              onChange={e => setField('salaryMax', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">Status</label>
          <Input value={job.status} onChange={e => setField('status', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">Description</label>
          <Textarea
            rows={4}
            value={job.description || ''}
            onChange={e => setField('description', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/jobs')}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Applications</h2>
            <p className="text-sm text-slate-600">Create and view applications for this job.</p>
          </div>
        </div>

        {appListError && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {appListError}
          </div>
        )}

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          {candidateError && <p className="mb-2 text-sm text-amber-800">{candidateError}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-800">Candidate</label>
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedCandidateId}
                onChange={e => setSelectedCandidateId(e.target.value)}
                disabled={isCreating}
              >
                <option value="">Select a candidate</option>
                {candidates.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name || candidate.email || candidate.id}
                  </option>
                ))}
              </select>
              {candidates.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No candidates yet — add or import candidates first.
                </p>
              )}
            </div>
            <Button onClick={handleCreateApplication} disabled={isCreating || !job?.id}>
              {isCreating ? 'Creating…' : 'Create Application'}
            </Button>
          </div>
          {createError && <p className="mt-2 text-sm text-amber-800">{createError}</p>}
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Candidate
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Stage
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {applications.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-500" colSpan={3}>
                    No applications yet.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{app.candidate_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{app.stage || 'applied'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function toNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
