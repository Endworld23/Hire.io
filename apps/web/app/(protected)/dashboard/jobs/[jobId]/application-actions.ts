'use server'

import { updateApplicationStage } from '@/lib/actions/applications'

export async function updateApplicationStageAction(formData: FormData) {
  const applicationId = formData.get('applicationId')
  const stage = formData.get('stage')

  if (typeof applicationId !== 'string' || typeof stage !== 'string') {
    throw new Error('Invalid submission')
  }

  const result = await updateApplicationStage(applicationId, stage)
  if (!result.success) {
    throw new Error(result.error || 'Unable to update stage')
  }
}
