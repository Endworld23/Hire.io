'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@hire-io/utils'
import type {
  CreateJobInput,
  AIIntakeInput,
  AIIntakeResult,
  EmploymentType,
  ExperienceLevel,
  ContractType,
} from '@hire-io/schemas'
import { createJobSchema, aiIntakeSchema, aiIntakeResultSchema } from '@hire-io/schemas'
import { getCurrentUserProfile } from '@/lib/server-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY

function stripPII(text: string): string {
  let cleaned = text
  cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
  cleaned = cleaned.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
  cleaned = cleaned.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[SSN]')
  return cleaned
}

export async function runJobIntakeAI(intakeData: AIIntakeInput): Promise<
  | { success: true; result: AIIntakeResult }
  | { error: string; details?: unknown }
> {
  const user = await getCurrentUserProfile()

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return { error: 'Unauthorized' }
  }

  const validation = aiIntakeSchema.safeParse(intakeData)
  if (!validation.success) {
    return { error: 'Invalid intake data', details: validation.error.errors }
  }

  if (!openaiApiKey) {
    console.warn('OpenAI API key not configured, returning mock response')
    return {
      success: true,
      result: {
        intakeSummary: `Role focus: ${intakeData.jobTitle}. Key impact: ${intakeData.whatYouNeed.slice(0, 120)}...`,
        idealCandidateProfile:
          'Ideal candidate has proven experience shipping complex projects, collaborates across teams, and demonstrates strong communication.',
        suggestedScreeningQuestions: [
          'Walk through a recent accomplishment that aligns with this role.',
          'Describe how you keep skills current with emerging tooling.',
          'What do you look for in an ideal team environment?',
        ],
      },
    }
  }

  try {
    const cleanedIntake = {
      ...intakeData,
      whatYouNeed: stripPII(intakeData.whatYouNeed),
      keyResponsibilities: intakeData.keyResponsibilities ? stripPII(intakeData.keyResponsibilities) : undefined,
      companyDescription: intakeData.companyDescription ? stripPII(intakeData.companyDescription) : undefined,
    }

    const prompt = `You are an unbiased recruiting assistant. Based on the intake data below, produce a JSON object with:
{
  "intake_summary": "2-3 sentences summarizing the role focus and impact",
  "ideal_candidate_profile": "2-3 sentences describing the type of candidate that thrives here",
  "suggested_screening_questions": [
    "3-7 short screening questions tailored to the role with no PII"
  ]
}

Input (no PII included):
Job Title: ${cleanedIntake.jobTitle}
Overview: ${cleanedIntake.whatYouNeed}
Responsibilities: ${cleanedIntake.keyResponsibilities || 'Not specified'}
Must-Have Skills: ${cleanedIntake.mustHaveSkills.join(', ')}
Nice-to-Have Skills: ${cleanedIntake.niceToHaveSkills.join(', ')}
Experience Required: ${cleanedIntake.experienceYears || 'Not specified'} years
Work Location: ${cleanedIntake.workLocation}
Budget Range: ${cleanedIntake.budgetRange ? `${cleanedIntake.budgetRange.min || 'n/a'}-${cleanedIntake.budgetRange.max || 'n/a'}` : 'Not specified'}

Return strict JSON matching the schema.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional recruiter AI that generates structured job insights. Always return valid JSON. Never include PII or demographic information and stay compliant with EEO guidelines.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    let parsed
    try {
      parsed = JSON.parse(aiResponse)
    } catch (e) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    const structured = aiIntakeResultSchema.safeParse({
      intakeSummary: parsed.intake_summary,
      idealCandidateProfile: parsed.ideal_candidate_profile,
      suggestedScreeningQuestions: parsed.suggested_screening_questions,
    })

    if (!structured.success) {
      console.error('AI response failed schema validation', structured.error.flatten())
      return { error: 'AI output invalid', details: structured.error.flatten() }
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any
    await supabase.from('events').insert({
      tenant_id: user.tenant_id,
      actor_user_id: user.id,
      entity_type: 'job_intake_draft',
      entity_id: null,
      action: 'ai_job_intake_qna',
      metadata: {
        intake_title: intakeData.jobTitle,
        model: 'gpt-4',
        tokens_used: data.usage?.total_tokens,
      },
    })

    return { success: true, result: structured.data }
  } catch (error) {
    console.error('AI generation error:', error)
    return { error: 'Failed to generate AI intake summary', details: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createJob(jobData: CreateJobInput) {
  const user = await getCurrentUserProfile()

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return { error: 'Unauthorized' }
  }

  const validation = createJobSchema.safeParse(jobData)
  if (!validation.success) {
    return { error: 'Invalid job data', details: validation.error.errors }
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        tenant_id: user.tenant_id,
        title: jobData.title,
        location: jobData.location,
        salary_min: jobData.salaryMin,
        salary_max: jobData.salaryMax,
        required_skills: jobData.requiredSkills,
        nice_to_have: jobData.preferredSkills,
        spec: buildJobSpec(jobData),
        status: jobData.status,
        created_by: user.id,
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    await supabase
      .from('events')
      .insert({
        tenant_id: user.tenant_id,
        actor_user_id: user.id,
        entity_type: 'job',
        entity_id: job.id,
        action: 'created',
        metadata: {
          title: jobData.title,
          status: jobData.status,
        },
      })

    revalidatePath('/dashboard/jobs')

    return { success: true, jobId: job.id }
  } catch (error) {
    console.error('Job creation error:', error)
    return { error: 'Failed to create job', details: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function listJobs() {
  const user = await getCurrentUserProfile()

  if (!user) {
    redirect('/sign-in')
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      applications:applications(count)
    `)
    .eq('tenant_id', user.tenant_id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch jobs:', error)
    return []
  }

  return jobs || []
}

export async function getJob(jobId: string) {
  const user = await getCurrentUserProfile()

  if (!user) {
    return null
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: job, error } = await supabase
    .from('jobs')
    .select(
      `
        *,
        applications:applications(
          id,
          stage,
          score,
          match_score,
          notes,
          created_at,
          feedback:job_application_feedback(
            id,
            rating,
            comment,
            created_at,
            author:users(full_name)
          ),
          candidate:candidates(
            id,
            full_name,
            skills,
            experience,
            resume_url
          )
        )
      `,
    )
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (error) {
    console.error('Failed to fetch job:', error)
    return null
  }

  return job
}

export type JobEditData = {
  id: string
  title: string
  description: string
  location: string
  employmentType: EmploymentType | ''
  experienceLevel: ExperienceLevel | ''
  requiredSkills: string[]
  preferredSkills: string[]
  salaryMin?: number
  salaryMax?: number
  hourlyRateMin?: number
  hourlyRateMax?: number
  contractType?: ContractType
  screeningQuestions: string[]
  intakeSummary?: string
  idealCandidateProfile?: string
  aiSuggestedQuestions: string[]
  status: CreateJobInput['status']
}

export async function getJobForEdit(jobId: string): Promise<JobEditData | null> {
  const user = await getCurrentUserProfile()
  if (!user) {
    return null
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, tenant_id, title, location, salary_min, salary_max, status, required_skills, nice_to_have, spec')
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (error || !job) {
    return null
  }

  const spec = job.spec || {}
  const compensation = spec.compensation || {}
  const aiIntake = spec.aiIntake || {}

  return {
    id: job.id,
    title: job.title,
    description: spec.description || '',
    location: job.location || '',
    employmentType: spec.employmentType || 'full-time',
    experienceLevel: spec.experienceLevel || '',
    requiredSkills: Array.isArray(job.required_skills) ? job.required_skills : [],
    preferredSkills: Array.isArray(job.nice_to_have) ? job.nice_to_have : [],
    salaryMin: job.salary_min ?? undefined,
    salaryMax: job.salary_max ?? undefined,
    hourlyRateMin: compensation.hourlyRange?.min ?? undefined,
    hourlyRateMax: compensation.hourlyRange?.max ?? undefined,
    contractType: compensation.contractType ?? undefined,
    screeningQuestions: Array.isArray(spec.screeningQuestions) ? spec.screeningQuestions : [],
    intakeSummary: aiIntake.summary || undefined,
    idealCandidateProfile: aiIntake.idealCandidateProfile || undefined,
    aiSuggestedQuestions: Array.isArray(aiIntake.suggestedScreeningQuestions)
      ? aiIntake.suggestedScreeningQuestions.filter(Boolean)
      : [],
    status: job.status,
  }
}

export async function updateJob(jobId: string, jobData: CreateJobInput) {
  const user = await getCurrentUserProfile()

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return { success: false, error: 'Unauthorized' }
  }

  const validation = createJobSchema.safeParse(jobData)
  if (!validation.success) {
    return {
      success: false,
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: existing } = await supabase
    .from('jobs')
    .select('id, tenant_id')
    .eq('id', jobId)
    .single()

  if (!existing || existing.tenant_id !== user.tenant_id) {
    return { success: false, error: 'Job not found' }
  }

  const payload = validation.data

  const { error: updateError } = await supabase
    .from('jobs')
    .update({
      title: payload.title,
      location: payload.location,
      salary_min: payload.salaryMin ?? null,
      salary_max: payload.salaryMax ?? null,
      required_skills: payload.requiredSkills,
      nice_to_have: payload.preferredSkills,
      spec: buildJobSpec(payload),
      status: payload.status,
    })
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)

  if (updateError) {
    console.error('Job update error:', updateError)
    return { success: false, error: 'Failed to update job' }
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'job',
    entity_id: jobId,
    action: 'job_updated',
    metadata: {
      title: payload.title,
      status: payload.status,
    },
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/jobs')

  return { success: true }
}

export async function archiveJob(jobId: string) {
  const user = await getCurrentUserProfile()

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ status: 'archived' })
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .select('id')
    .single()

  if (error || !job) {
    console.error('Job archive error:', error)
    return { success: false, error: 'Unable to archive job' }
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'job',
    entity_id: jobId,
    action: 'job_archived',
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard/jobs')

  return { success: true }
}

function buildJobSpec(jobData: CreateJobInput) {
  return {
    description: jobData.description,
    employmentType: jobData.employmentType,
    experienceLevel: jobData.experienceLevel,
    screeningQuestions: jobData.screeningQuestions,
    aiIntake: {
      summary: jobData.intakeSummary || null,
      idealCandidateProfile: jobData.idealCandidateProfile || null,
      suggestedScreeningQuestions: jobData.aiSuggestedQuestions || null,
    },
    compensation: {
      salaryRange:
        jobData.salaryMin || jobData.salaryMax
          ? {
              min: jobData.salaryMin || null,
              max: jobData.salaryMax || null,
            }
          : null,
      hourlyRange:
        jobData.hourlyRateMin || jobData.hourlyRateMax
          ? {
              min: jobData.hourlyRateMin || null,
              max: jobData.hourlyRateMax || null,
            }
          : null,
      contractType: jobData.contractType || null,
    },
  }
}

export type JobMetrics = {
  totalApplications: number
  byStage: Record<string, number>
  averageMatchScore: number | null
  clientShortlistedCount: number
  clientRejectedCount: number
}

export async function getJobMetrics(jobId: string): Promise<JobMetrics | null> {
  const user = await getCurrentUserProfile()
  if (!user) {
    return null
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: applications, error } = await supabase
    .from('applications')
    .select('stage, match_score')
    .eq('job_id', jobId)
    .eq('tenant_id', user.tenant_id)

  if (error) {
    console.error('Job metrics error', error)
    return null
  }

  const byStage: Record<string, number> = {}
  let matchScoreSum = 0
  let matchScoreCount = 0
  let shortlisted = 0
  let rejected = 0

  for (const application of applications || []) {
    const stage = application.stage || 'unknown'
    byStage[stage] = (byStage[stage] || 0) + 1

    if (typeof application.match_score === 'number') {
      matchScoreSum += Number(application.match_score)
      matchScoreCount += 1
    }

    if (stage === 'client_shortlisted') {
      shortlisted += 1
    }
    if (stage === 'client_rejected') {
      rejected += 1
    }
  }

  return {
    totalApplications: applications?.length || 0,
    byStage,
    averageMatchScore: matchScoreCount ? Math.round((matchScoreSum / matchScoreCount) * 10) / 10 : null,
    clientShortlistedCount: shortlisted,
    clientRejectedCount: rejected,
  }
}
