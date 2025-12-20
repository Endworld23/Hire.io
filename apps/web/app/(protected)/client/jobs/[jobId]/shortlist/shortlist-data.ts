'use server'

import { randomUUID } from 'crypto'
import { notFound } from 'next/navigation'
import { createSupabaseClient } from '@hire-io/utils'
import { requireClientUser } from '@/lib/server-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

export type ClientShortlistCandidate = {
  applicationId: string
  alias: string
  matchScore: number
  stage: 'under_review' | 'shortlisted' | 'rejected'
  stageLabel: string
  skills: string[]
  experienceLabel: string
  notes?: string | null
}

export type ClientShortlistData = {
  job: {
    id: string
    title: string
    location: string | null
    employmentType?: string | null
    requiredSkills: string[]
    niceToHave: string[]
  }
  candidates: ClientShortlistCandidate[]
}

export async function getClientShortlist(jobId: string): Promise<ClientShortlistData> {
  const user = await requireClientUser()
  if (!user) {
    notFound()
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseSecretKey) as any

  const { data: job } = await supabase
    .from('jobs')
    .select('id, tenant_id, title, location, spec, required_skills, nice_to_have')
    .eq('id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (!job) {
    notFound()
  }

  const { data: applications, error } = await supabase
    .from('applications')
    .select(
      `
        id,
        stage,
        match_score,
        score,
        notes,
        created_at,
        candidate:candidates(
          id,
          public_id,
          full_name,
          skills,
          experience
        )
      `
    )
    .eq('tenant_id', user.tenant_id)
    .eq('job_id', job.id)

  if (error) {
    console.error('Failed to load shortlist applications', error)
    notFound()
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'job',
    entity_id: job.id,
    action: 'client_viewed_shortlist',
    metadata: { job_id: job.id },
  })

  const requiredSkills = Array.isArray(job.required_skills) ? job.required_skills : []
  const niceToHave = Array.isArray(job.nice_to_have) ? job.nice_to_have : []

  const candidates = (applications || []).map((application: any) =>
    toClientShortlistCandidate({
      application,
      requiredSkills,
      niceToHave,
    })
  )

  return {
    job: {
      id: job.id,
      title: job.title,
      location: job.location,
      employmentType: job.spec?.employmentType ?? null,
      requiredSkills,
      niceToHave,
    },
    candidates,
  }
}

function toClientShortlistCandidate({
  application,
  requiredSkills,
  niceToHave,
}: {
  application: any
  requiredSkills: string[]
  niceToHave: string[]
}): ClientShortlistCandidate {
  const candidate = application.candidate ?? {}
  const alias = buildAlias(candidate)
  const skills = Array.isArray(candidate.skills) ? candidate.skills.slice(0, 5) : []
  const years = candidate.experience?.yearsOfExperience
  const experienceLabel = years != null ? `${years}+ yrs experience` : 'Experience TBD'
  const matchScore =
    typeof application.match_score === 'number'
      ? Math.round(Number(application.match_score))
      : computeMatchScore({
          requiredSkills,
          niceToHave,
          candidateSkills: skills,
          fallbackScore: application.score,
        })
  const stage = mapStage(application.stage)
  const stageLabel = stage === 'shortlisted' ? 'Shortlisted' : stage === 'rejected' ? 'Removed' : 'Under Review'

  return {
    applicationId: application.id,
    alias,
    matchScore,
    stage,
    stageLabel,
    skills,
    experienceLabel,
    notes: application.notes,
  }
}

function buildAlias(candidate: { full_name?: string; public_id?: string; id?: string }) {
  if (candidate.full_name && candidate.full_name.toLowerCase().startsWith('candidate')) {
    return candidate.full_name
  }
  const source = candidate.public_id || candidate.id || randomUUID()
  return `Candidate-${String(source).slice(0, 6).toUpperCase()}`
}

function computeMatchScore({
  requiredSkills,
  niceToHave,
  candidateSkills,
  fallbackScore,
}: {
  requiredSkills: string[]
  niceToHave: string[]
  candidateSkills: string[]
  fallbackScore?: number | null
}) {
  if (typeof fallbackScore === 'number') {
    return Math.round(fallbackScore)
  }

  if (!candidateSkills.length) {
    return 50
  }

  const normalized = (skill: string) => skill.trim().toLowerCase()
  const candidateSet = new Set(candidateSkills.map(normalized))
  const requiredMatches = requiredSkills.filter(skill => candidateSet.has(normalized(skill))).length
  const niceMatches = niceToHave.filter(skill => candidateSet.has(normalized(skill))).length

  const totalRequired = Math.max(requiredSkills.length, 1)
  const requiredScore = (requiredMatches / totalRequired) * 70
  const niceScore = niceToHave.length ? (niceMatches / niceToHave.length) * 30 : 0

  return Math.round(Math.min(requiredScore + niceScore, 100))
}

function mapStage(stage: string): ClientShortlistCandidate['stage'] {
  if (stage === 'client_shortlisted') return 'shortlisted'
  if (stage === 'client_rejected' || stage === 'rejected') return 'rejected'
  return 'under_review'
}
