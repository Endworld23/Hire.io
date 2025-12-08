// @ts-nocheck
'use server'

import { Buffer } from 'node:buffer'
import { revalidatePath } from 'next/cache'
import { createSupabaseClient, type SupabaseClient } from '@hire-io/utils'
import { eeoCandidateIntakeSchema, applicationStageSchema } from '@hire-io/schemas'
import { getCurrentUserProfile } from '@/lib/server-user'
import { recomputeMatchesForJob } from '@/lib/actions/matching'
import { parseResume } from '@/lib/resume-parser'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESUME_BUCKET = 'resumes'
const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export type AddCandidateFormState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function addCandidateAction(
  _prevState: AddCandidateFormState,
  formData: FormData,
): Promise<AddCandidateFormState> {
  // Phase 1 – Core ATS – Candidate Upload + Parsing
  const user = await getCurrentUserProfile()
  if (!user) {
    return { error: 'Unauthorized. Please sign in again.' }
  }

  const jobId = formData.get('jobId')
  if (typeof jobId !== 'string' || jobId.length === 0) {
    return { error: 'Missing job identifier.' }
  }

  const intake = {
    alias: formData.get('alias'),
    headline: formData.get('headline'),
    desiredCompMin: parseOptionalNumber(formData.get('desiredCompMin')),
    desiredCompMax: parseOptionalNumber(formData.get('desiredCompMax')),
  }

  const parsedIntake = eeoCandidateIntakeSchema.safeParse({
    alias: typeof intake.alias === 'string' ? intake.alias : '',
    headline: typeof intake.headline === 'string' && intake.headline.length > 0 ? intake.headline : undefined,
    desiredCompMin: intake.desiredCompMin,
    desiredCompMax: intake.desiredCompMax,
  })

  if (!parsedIntake.success) {
    return {
      fieldErrors: flattenZodErrors(parsedIntake.error.flatten().fieldErrors),
    }
  }

  if (
    parsedIntake.data.desiredCompMin &&
    parsedIntake.data.desiredCompMax &&
    parsedIntake.data.desiredCompMin > parsedIntake.data.desiredCompMax
  ) {
    return { fieldErrors: { desiredCompMax: 'Max comp should be higher than min comp' } }
  }

  const resumeFile = formData.get('resume')
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return { fieldErrors: { resume: 'Resume file is required' } }
  }

  if (resumeFile.size > MAX_FILE_SIZE) {
    return { fieldErrors: { resume: 'Resume must be smaller than 8MB' } }
  }

  if (resumeFile.type && !ALLOWED_FILE_TYPES.includes(resumeFile.type)) {
    return { fieldErrors: { resume: 'Unsupported file type. Upload PDF or Word documents.' } }
  }

  const fileArrayBuffer = await resumeFile.arrayBuffer()
  const fileBuffer = Buffer.from(fileArrayBuffer)
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: job } = await supabase
    .from('jobs')
    .select('id, tenant_id')
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (!job) {
    return { error: 'Job not found for this tenant.' }
  }

  const resumePath = await uploadResumeFile({
    supabase,
    tenantId: user.tenant_id,
    jobId: job.id,
    file: resumeFile,
    buffer: fileBuffer,
  })

  if (!resumePath) {
    return { error: 'Failed to store resume. Try again.' }
  }

  let resumeInsights: Awaited<ReturnType<typeof parseResume>> | null = null
  try {
    resumeInsights = await parseResume(fileBuffer, resumeFile.type || '', resumeFile.name)
    await supabase.from('events').insert({
      tenant_id: user.tenant_id,
      actor_user_id: user.id,
      entity_type: 'resume',
      entity_id: null,
      action: 'resume_parsed_success',
      metadata: {
        job_id: job.id,
        file_type: resumeFile.type || 'unknown',
        file_size: resumeFile.size,
        parser_version: 'v1',
      },
    })
  } catch (error) {
    console.error('Resume parsing error', error)
    await supabase.from('events').insert({
      tenant_id: user.tenant_id,
      actor_user_id: user.id,
      entity_type: 'resume',
      entity_id: null,
      action: 'resume_parsed_failure',
      metadata: {
        job_id: job.id,
        file_type: resumeFile.type || 'unknown',
        file_size: resumeFile.size,
        parser_version: 'v1',
        error: error instanceof Error ? error.message : 'unknown',
      },
    })
  }

  const maskedEmail = `${parsedIntake.data.alias.replace(/\s+/g, '').toLowerCase()}@candidate.hidden`

  const { data: candidate, error: candidateError } = await supabase
    .from('candidates')
    .insert({
      owner_tenant_id: user.tenant_id,
      is_global: false,
      full_name: parsedIntake.data.alias,
      email: maskedEmail,
      phone: null,
      location: null,
      skills: resumeInsights?.skills ?? [],
      experience: {
        yearsOfExperience: resumeInsights?.yearsOfExperience ?? null,
        summary: resumeInsights?.summary || null,
        techTags: resumeInsights?.techTags || [],
      },
      resume_url: resumePath,
      resume_text: resumeInsights?.text || '',
    })
    .select()
    .single()

  if (candidateError || !candidate) {
    console.error('Candidate insert error', candidateError)
    return { error: 'Unable to save candidate profile.' }
  }

  const { data: application, error: applicationError } = await supabase
    .from('applications')
    .insert({
      tenant_id: user.tenant_id,
      job_id: job.id,
      candidate_id: candidate.id,
      stage: applicationStageSchema.enum.applied,
      notes: parsedIntake.data.headline,
    })
    .select()
    .single()

  if (applicationError || !application) {
    console.error('Application insert error', applicationError)
    return { error: 'Unable to create application record.' }
  }

  await supabase.from('events').insert([
    {
      tenant_id: user.tenant_id,
      actor_user_id: user.id,
      entity_type: 'candidate',
      entity_id: candidate.id,
      action: 'created',
      metadata: {
        alias: parsedIntake.data.alias,
        job_id: job.id,
      },
    },
    {
      tenant_id: user.tenant_id,
      actor_user_id: user.id,
      entity_type: 'application',
      entity_id: application.id,
      action: 'created',
      metadata: {
        job_id: job.id,
        candidate_id: candidate.id,
        stage: application.stage,
      },
    },
  ])

  revalidatePath(`/dashboard/jobs/${job.id}`)
  await recomputeMatchesForJob(job.id, user.tenant_id)

  return { success: true }
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (!value) return undefined
  const numeric = typeof value === 'string' ? Number(value) : Number(String(value))
  return Number.isFinite(numeric) ? numeric : undefined
}

function flattenZodErrors(errors: Record<string, string[] | undefined>) {
  return Object.entries(errors).reduce<Record<string, string>>((acc, [key, messages]) => {
    if (messages && messages.length > 0) {
      acc[key] = messages[0]
    }
    return acc
  }, {})
}

async function uploadResumeFile({
  supabase,
  tenantId,
  jobId,
  file,
  buffer,
}: {
  supabase: SupabaseClient
  tenantId: string
  jobId: string
  file: File
  buffer: Buffer
}) {
  const extension = file.name.split('.').pop() || 'pdf'
  const safeName = `${crypto.randomUUID()}.${extension}`
  const storagePath = `${tenantId}/${jobId}/${safeName}`
  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error', error)
    return null
  }

  return `${RESUME_BUCKET}/${storagePath}`
}
