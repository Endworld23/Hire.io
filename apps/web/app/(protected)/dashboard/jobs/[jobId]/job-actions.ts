'use server'

import type { CreateJobInput } from '@hire-io/schemas'
import { updateJob, archiveJob } from '@/lib/actions/jobs'

export async function updateJobAction(jobId: string, payload: CreateJobInput) {
  return updateJob(jobId, payload)
}

export async function archiveJobAction(jobId: string, _formData: FormData): Promise<void> {
  const result = await archiveJob(jobId)
  if (!result.success) {
    throw new Error(result.error || 'Unable to archive job')
  }
}
