import { z } from 'zod'

export const candidateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.record(z.unknown()).optional(),
  resumeUrl: z.string().url().optional(),
  resumeText: z.string().optional(),
})

export const updateCandidateSchema = candidateSchema.partial()

export const candidateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        yearsOfExperience: z.number().nonnegative().optional(),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .default([]),
})

export const eeoCandidateIntakeSchema = z.object({
  alias: z
    .string()
    .min(3, 'Alias must be at least 3 characters')
    .max(64, 'Alias must be at most 64 characters')
    .regex(/^[a-zA-Z0-9\-_\s]+$/, 'Alias can only include letters, numbers, spaces, hyphens, and underscores'),
  headline: z.string().max(160, 'Headline is too long').optional(),
  desiredCompMin: z
    .number({ invalid_type_error: 'Desired compensation must be a number' })
    .int()
    .positive()
    .optional(),
  desiredCompMax: z
    .number({ invalid_type_error: 'Desired compensation must be a number' })
    .int()
    .positive()
    .optional(),
})

export type CandidateInput = z.infer<typeof candidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>
export type EEOCandidateIntake = z.infer<typeof eeoCandidateIntakeSchema>
