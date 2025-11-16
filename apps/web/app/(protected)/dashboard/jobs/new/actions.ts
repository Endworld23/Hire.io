'use server'

import { createJob, runJobIntakeAI } from '@/lib/actions/jobs'
import { createJobSchema, aiIntakeSchema, type CreateJobInput, type AIIntakeInput } from '@hire-io/schemas'

type FieldErrorMap = Record<string, string[] | undefined>

export type SubmitJobResult =
  | { success: true; jobId: string }
  | { success: false; error?: string; fieldErrors?: FieldErrorMap }

export async function submitJob(input: CreateJobInput): Promise<SubmitJobResult> {
  // Phase 1 – Core ATS (Job Builder) – /docs/roadmap.md §Phase 1
  const parsed = createJobSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await createJob(parsed.data)

  if (result?.error) {
    return { success: false, error: result.error }
  }

  return { success: true, jobId: result.jobId }
}

export async function generateIntakeSuggestions(input: AIIntakeInput) {
  const parsed = aiIntakeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await runJobIntakeAI(parsed.data)
  return result
}
