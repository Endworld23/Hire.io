'use server'

import { createClient } from '@supabase/supabase-js'
import { calculateMatchScore } from '@/lib/matching-engine'
import { getCurrentUserProfile } from '@/lib/server-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type JobRecord = {
  id: string
  tenant_id: string
  required_skills: string[]
  nice_to_have: string[]
  spec: {
    experienceLevel?: string
    matchSettings?: {
      leniency?: number
    }
  }
}

type ApplicationRecord = {
  id: string
  candidate: {
    skills?: string[]
    experience?: {
      yearsOfExperience?: number
    }
  }
}

export async function recomputeMatchesForJob(jobId: string, tenantId?: string) {
  const user = await getCurrentUserProfile()
  if (!user) {
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: job } = await supabase
    .from('jobs')
    .select('id, tenant_id, required_skills, nice_to_have, spec')
    .eq('id', jobId)
    .eq('tenant_id', tenantId || user.tenant_id)
    .single()

  if (!job) {
    return
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(
      `
        id,
        candidate:candidates(
          skills,
          experience
        )
      `,
    )
    .eq('job_id', job.id)
    .eq('tenant_id', job.tenant_id)

  if (!applications || applications.length === 0) {
    await supabase.from('events').insert({
      tenant_id: job.tenant_id,
      actor_user_id: user.id,
      entity_type: 'job',
      entity_id: job.id,
      action: 'job_matches_recomputed',
      metadata: {
        matches: 0,
      },
    })
    return
  }

  for (const application of applications as ApplicationRecord[]) {
    const candidateSkills = application.candidate?.skills || []
    const yearsOfExperience = application.candidate?.experience?.yearsOfExperience

    const score = calculateMatchScore(
      {
        requiredSkills: job.required_skills || [],
        preferredSkills: job.nice_to_have || [],
        experienceLevel: job.spec?.experienceLevel,
        leniency: job.spec?.matchSettings?.leniency ?? 0.5,
      },
      {
        skills: candidateSkills,
        yearsOfExperience,
      },
    )

    await supabase
      .from('applications')
      .update({ match_score: score })
      .eq('id', application.id)
  }

  await supabase.from('events').insert({
    tenant_id: job.tenant_id,
    actor_user_id: user.id,
    entity_type: 'job',
    entity_id: job.id,
    action: 'job_matches_recomputed',
    metadata: {
      matches: applications.length,
    },
  })
}
