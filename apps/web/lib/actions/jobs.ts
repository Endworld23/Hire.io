'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { CreateJobInput, AIIntakeInput } from '@hire-io/schemas'
import { createJobSchema, aiIntakeSchema } from '@hire-io/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY

async function getCurrentUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value

  if (!accessToken) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user) {
    return null
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userProfile
}

function stripPII(text: string): string {
  let cleaned = text
  cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
  cleaned = cleaned.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
  cleaned = cleaned.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[SSN]')
  return cleaned
}

export async function generateAIJobSpec(intakeData: AIIntakeInput) {
  const user = await getCurrentUser()

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
      spec: {
        refinedTitle: intakeData.jobTitle,
        refinedDescription: `${intakeData.whatYouNeed}\n\n${intakeData.keyResponsibilities || ''}`,
        requiredSkills: intakeData.mustHaveSkills,
        preferredSkills: intakeData.niceToHaveSkills,
        experienceLevel: intakeData.experienceYears && intakeData.experienceYears > 7 ? 'senior' :
                         intakeData.experienceYears && intakeData.experienceYears > 3 ? 'mid' : 'entry',
        screeningQuestions: [
          'Describe your experience with the required technologies',
          'What interests you about this role?',
          'What are your salary expectations?',
        ],
        compensationInsights: intakeData.budgetRange ? {
          suggestedMin: intakeData.budgetRange.min,
          suggestedMax: intakeData.budgetRange.max,
        } : null,
      }
    }
  }

  try {
    const cleanedIntake = {
      ...intakeData,
      whatYouNeed: stripPII(intakeData.whatYouNeed),
      keyResponsibilities: intakeData.keyResponsibilities ? stripPII(intakeData.keyResponsibilities) : undefined,
      companyDescription: intakeData.companyDescription ? stripPII(intakeData.companyDescription) : undefined,
    }

    const prompt = `You are an expert recruiter helping to create a structured job posting. Based on the following intake information, generate a well-structured job specification:

Job Title: ${cleanedIntake.jobTitle}
What We Need: ${cleanedIntake.whatYouNeed}
Key Responsibilities: ${cleanedIntake.keyResponsibilities || 'Not specified'}
Must-Have Skills: ${cleanedIntake.mustHaveSkills.join(', ')}
Nice-to-Have Skills: ${cleanedIntake.niceToHaveSkills.join(', ')}
Experience Required: ${cleanedIntake.experienceYears || 'Not specified'} years
Work Location: ${cleanedIntake.workLocation}

Generate a JSON response with:
1. refinedTitle: A professional, clear job title
2. refinedDescription: A compelling 2-3 paragraph job description (200-300 words)
3. requiredSkills: Array of required technical skills
4. preferredSkills: Array of nice-to-have skills
5. experienceLevel: One of: entry, mid, senior, lead, executive
6. screeningQuestions: Array of 3-5 relevant screening questions
7. compensationInsights: Suggested salary range based on role and experience

Ensure no PII is included. Return only valid JSON.`

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
            content: 'You are a professional recruiter AI that generates structured job specifications. Always return valid JSON. Never include PII or demographic information.',
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

    let spec
    try {
      spec = JSON.parse(aiResponse)
    } catch (e) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        spec = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    await supabase
      .from('events')
      .insert({
        tenant_id: user.tenant_id,
        actor_user_id: user.id,
        entity_type: 'ai_job_generation',
        entity_id: null,
        action: 'generated',
        metadata: {
          intake_title: intakeData.jobTitle,
          model: 'gpt-4',
          tokens_used: data.usage?.total_tokens,
        },
      })

    return { success: true, spec }
  } catch (error) {
    console.error('AI generation error:', error)
    return { error: 'Failed to generate AI spec', details: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createJob(jobData: CreateJobInput) {
  const user = await getCurrentUser()

  if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
    return { error: 'Unauthorized' }
  }

  const validation = createJobSchema.safeParse(jobData)
  if (!validation.success) {
    return { error: 'Invalid job data', details: validation.error.errors }
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
        spec: {
          description: jobData.description,
          employmentType: jobData.employmentType,
          experienceLevel: jobData.experienceLevel,
          screeningQuestions: jobData.screeningQuestions,
        },
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
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      applications:applications(count)
    `)
    .eq('tenant_id', user.tenant_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch jobs:', error)
    return []
  }

  return jobs || []
}

export async function getJob(jobId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (error) {
    console.error('Failed to fetch job:', error)
    return null
  }

  return job
}
