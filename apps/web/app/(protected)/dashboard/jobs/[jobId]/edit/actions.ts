'use server'

import { redirect } from 'next/navigation'
import { updateJob, getJobForEdit } from '@/lib/actions/jobs'
import type { CreateJobInput } from '@hire-io/schemas'

export async function loadJob(jobId: string) {
  const job = await getJobForEdit(jobId)
  return job
}

export async function submitJobUpdate(jobId: string, data: Partial<CreateJobInput>) {
  const result = await updateJob(jobId, data as CreateJobInput)
  if (!result.success) {
    return { success: false, error: result.error || 'Unable to update job' }
  }
  redirect('/dashboard/jobs?updated=1')
}
