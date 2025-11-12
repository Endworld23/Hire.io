import { z } from 'zod'

export const jobStatusSchema = z.enum(['draft', 'active', 'closed'])

export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  location: z.string().optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  requiredSkills: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  spec: z.record(z.unknown()).optional(),
  status: jobStatusSchema.default('draft'),
})

export const updateJobSchema = jobSchema.partial()

export const jobIntakeSchema = z.object({
  title: z.string().min(3, 'Job title is required'),
  location: z.string().optional(),
  salaryRange: z.object({
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  }).optional(),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill is needed'),
  niceToHave: z.array(z.string()).default([]),
  experienceYears: z.number().int().nonnegative().optional(),
  remote: z.enum(['onsite', 'hybrid', 'remote']).optional(),
  notes: z.string().optional(),
})

export type JobInput = z.infer<typeof jobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type JobIntakeInput = z.infer<typeof jobIntakeSchema>
