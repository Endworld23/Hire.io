import { z } from 'zod'

export const applicationStageSchema = z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])

export const applicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  candidateId: z.string().uuid('Invalid candidate ID'),
  stage: applicationStageSchema.default('applied'),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export const updateApplicationSchema = z.object({
  stage: applicationStageSchema.optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export type ApplicationInput = z.infer<typeof applicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
