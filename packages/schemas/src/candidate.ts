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
  skills: z.array(z.object({
    name: z.string(),
    yearsOfExperience: z.number().nonnegative().optional(),
  })).default([]),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).default([]),
})

export type CandidateInput = z.infer<typeof candidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>
