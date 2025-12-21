'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Textarea, Button } from '@/components/ui'
import type { CreateJobInput, EmploymentType, ContractType } from '@hire-io/schemas'
import { loadJob, submitJobUpdate } from './actions'

type EditableJob = CreateJobInput & {
  id: string
  salaryMin?: number | null
  salaryMax?: number | null
  hourlyRateMin?: number | null
  hourlyRateMax?: number | null
  contractType?: ContractType | null
}

export default function EditJobPage() {
  const router = useRouter()
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<EditableJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, startSubmitTransition] = useTransition()

  useEffect(() => {
    if (!jobId) return
    ;(async () => {
      const data = await loadJob(jobId)
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

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
    </div>
  )
}

function toNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
