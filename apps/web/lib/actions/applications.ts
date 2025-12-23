'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { applicationStageSchema } from '@hire-io/schemas'
import { createServerSupabase } from '@/lib/supabase-server'

type ApplicationRecord = {
  id: string
  job_id: string
  candidate_id: string
  stage: string | null
  tenant_id: string
  created_at: string
}

async function getAuthedContext() {
  const supabase = (await createServerSupabase()) as any
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.warn('[applications] getUser error', { message: userError.message })
    return { error: 'Session error', supabase }
  }
  if (!user) {
    return { error: 'Unauthorized', supabase }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.tenant_id) {
    console.warn('[applications] profile error', { message: profileError?.message, userId: user.id })
    return { error: 'Profile not available', supabase }
  }

  return { supabase, profile }
}

const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid(),
  stage: z.string().optional(),
})

export async function listApplicationsByJob(jobId: string) {
  const ctx = await getAuthedContext()
  if ('error' in ctx) {
    return { applications: [], error: ctx.error }
  }

  const { supabase, profile } = ctx
  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    return { applications: [], error: 'Unauthorized' }
  }

  const tenantId = profile.tenant_id as string

  const { data, error } = await supabase
    .from('applications')
    .select('id, job_id, candidate_id, stage, tenant_id, created_at')
    .eq('tenant_id', tenantId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[applications] list error', { message: error.message, jobId })
    return { applications: [], error: error.message }
  }

  return { applications: (data as ApplicationRecord[]) || [], error: undefined }
}

export async function createApplication(input: { jobId: string; candidateId: string; stage?: string }) {
  const parsed = createApplicationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid application payload' }
  }
  const ctx = await getAuthedContext()
  if ('error' in ctx) {
    return { success: false as const, error: ctx.error }
  }

  const { supabase, profile } = ctx

  if (profile.role !== 'admin' && profile.role !== 'recruiter') {
    return { success: false as const, error: 'Only recruiters or admins can create applications' }
  }

  const tenantId = profile.tenant_id as string

  // Optional: confirm job and candidate belong to tenant to produce clearer errors than RLS
  const [{ data: job }, { data: candidate }] = await Promise.all([
    supabase.from('jobs').select('id, tenant_id').eq('id', parsed.data.jobId).single(),
    supabase.from('candidates').select('id, owner_tenant_id').eq('id', parsed.data.candidateId).single(),
  ])

  if (!job || job.tenant_id !== tenantId) {
    return { success: false as const, error: 'Job not found in your tenant' }
  }

  if (!candidate || candidate.owner_tenant_id !== tenantId) {
    return { success: false as const, error: 'Candidate not found in your tenant' }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: parsed.data.jobId,
      candidate_id: parsed.data.candidateId,
      stage: parsed.data.stage ?? 'applied',
      tenant_id: tenantId,
    })
    .select('id, job_id, candidate_id, stage, tenant_id, created_at')
    .single()

  if (error) {
    console.warn('[applications] create error', { message: error.message })
    return { success: false as const, error: error.message }
  }

  revalidatePath(`/dashboard/jobs/${parsed.data.jobId}`)
  return { success: true as const, application: data as ApplicationRecord }
}

type StageUpdateResult = { success: true } | { success: false; error?: string }

export async function updateApplicationStage(applicationId: string, stage: string): Promise<StageUpdateResult> {
  const parsedStage = applicationStageSchema.safeParse(stage)
  if (!parsedStage.success) {
    return { success: false, error: 'Invalid stage selected' }
  }

  const ctx = await getAuthedContext()
  if ('error' in ctx) {
    return { success: false, error: ctx.error }
  }

  const { supabase, profile } = ctx
  const tenantId = profile.tenant_id as string

  const { data: application, error: loadError } = await supabase
    .from('applications')
    .select('id, job_id, tenant_id, stage')
    .eq('id', applicationId)
    .single()

  if (loadError || !application || application.tenant_id !== tenantId) {
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
    tenant_id: tenantId,
    actor_user_id: profile.id,
    entity_type: 'application',
    entity_id: (application as any).id,
    action: 'application_stage_changed',
    metadata: {
      job_id: (application as any).job_id,
      old_stage: (application as any).stage,
      new_stage: parsedStage.data,
    },
  })

  revalidatePath(`/dashboard/jobs/${(application as any).job_id}`)

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

  const ctx = await getAuthedContext()
  if ('error' in ctx || !ctx.profile) {
    throw new Error(ctx.error || 'Unauthorized')
  }

  const { supabase, profile } = ctx
  const tenantId = profile.tenant_id as string

  const { data: application, error: loadError } = await supabase
    .from('applications')
    .select('id, job_id, tenant_id')
    .eq('id', parsed.data.applicationId)
    .single()

  if (loadError || !application || application.tenant_id !== tenantId) {
    throw new Error('Application not found')
  }

  const { error } = await supabase.from('job_application_feedback').insert({
    tenant_id: tenantId,
    job_id: (application as any).job_id,
    application_id: (application as any).id,
    author_user_id: profile.id,
    rating: parsed.data.rating ?? null,
    comment: parsed.data.comment,
  })

  if (error) {
    console.error('Feedback insert error', error)
    throw new Error('Unable to submit feedback')
  }

  await supabase.from('events').insert({
    tenant_id: tenantId,
    actor_user_id: profile.id,
    entity_type: 'application',
    entity_id: (application as any).id,
    action: 'application_feedback_added',
    metadata: {
      job_id: (application as any).job_id,
    },
  })

  revalidatePath(`/dashboard/jobs/${(application as any).job_id}`)
}
