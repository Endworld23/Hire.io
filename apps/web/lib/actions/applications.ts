'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseClient } from '@hire-io/utils'
import { z } from 'zod'
import { applicationStageSchema } from '@hire-io/schemas'
import { getCurrentUserProfile } from '@/lib/server-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type StageUpdateResult =
  | { success: true }
  | { success: false; error?: string }

export async function updateApplicationStage(applicationId: string, stage: string): Promise<StageUpdateResult> {
  const parsedStage = applicationStageSchema.safeParse(stage)
  if (!parsedStage.success) {
    return { success: false, error: 'Invalid stage selected' }
  }

  const user = await getCurrentUserProfile()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: application } = await supabase
    .from('applications')
    .select('id, job_id, tenant_id, stage')
    .eq('id', applicationId)
    .single()

  if (!application || application.tenant_id !== user.tenant_id) {
    return { success: false, error: 'Application not found' }
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({ stage: parsedStage.data })
    .eq('id', applicationId)

  if (updateError) {
    console.error('Stage update error:', updateError)
    return { success: false, error: 'Unable to update stage' }
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'application',
    entity_id: application.id,
    action: 'application_stage_changed',
    metadata: {
      job_id: application.job_id,
      old_stage: application.stage,
      new_stage: parsedStage.data,
    },
  })

  revalidatePath(`/dashboard/jobs/${application.job_id}`)

  return { success: true }
}

const feedbackSchema = z.object({
  applicationId: z.string().uuid(),
  jobId: z.string().uuid(),
  rating: z
    .preprocess(value => (value === '' || value === null ? undefined : Number(value)), z.number().min(1).max(5))
    .optional(),
  comment: z.string().min(3, 'Comment is required'),
})

export async function addApplicationFeedback(formData: FormData) {
  const parsed = feedbackSchema.safeParse({
    applicationId: formData.get('applicationId'),
    jobId: formData.get('jobId'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  })

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || 'Invalid feedback submission')
  }

  const user = await getCurrentUserProfile()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: application } = await supabase
    .from('applications')
    .select('id, job_id, tenant_id')
    .eq('id', parsed.data.applicationId)
    .single()

  if (!application || application.tenant_id !== user.tenant_id) {
    throw new Error('Application not found')
  }

  const { error } = await supabase.from('job_application_feedback').insert({
    tenant_id: user.tenant_id,
    job_id: application.job_id,
    application_id: application.id,
    author_user_id: user.id,
    rating: parsed.data.rating ?? null,
    comment: parsed.data.comment,
  })

  if (error) {
    console.error('Feedback insert error', error)
    throw new Error('Unable to submit feedback')
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'application',
    entity_id: application.id,
    action: 'application_feedback_added',
    metadata: {
      job_id: application.job_id,
    },
  })

  revalidatePath(`/dashboard/jobs/${application.job_id}`)
}
