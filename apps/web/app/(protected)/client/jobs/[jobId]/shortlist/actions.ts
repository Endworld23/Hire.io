'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseClient } from '@hire-io/utils'
import { requireClientUser } from '@/lib/server-user'
import { applicationStageSchema } from '@hire-io/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type Decision = 'shortlist' | 'reject'

export type DecisionActionResult = {
  success?: boolean
  error?: string
}

export async function updateShortlistDecision({
  jobId,
  applicationId,
  decision,
}: {
  jobId: string
  applicationId: string
  decision: Decision
}): Promise<DecisionActionResult> {
  const user = await requireClientUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey) as any

  const { data: application } = await supabase
    .from('applications')
    .select('id, job_id, tenant_id, stage')
    .eq('id', applicationId)
    .eq('job_id', jobId)
    .eq('tenant_id', user.tenant_id)
    .single()

  if (!application) {
    return { error: 'Application not found' }
  }

  const nextStage =
    decision === 'shortlist'
      ? applicationStageSchema.enum.client_shortlisted
      : applicationStageSchema.enum.client_rejected

  const { error: updateError } = await supabase
    .from('applications')
    .update({ stage: nextStage })
    .eq('id', applicationId)

  if (updateError) {
    console.error('Failed to update shortlist decision', updateError)
    return { error: 'Unable to update candidate status.' }
  }

  await supabase.from('events').insert({
    tenant_id: user.tenant_id,
    actor_user_id: user.id,
    entity_type: 'application',
    entity_id: applicationId,
    action: decision === 'shortlist' ? 'client_shortlisted_candidate' : 'client_rejected_candidate',
    metadata: {
      job_id: jobId,
      decision: nextStage,
    },
  })

  revalidatePath(`/client/jobs/${jobId}/shortlist`)

  return { success: true }
}
