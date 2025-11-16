import { z } from 'zod'

export const jobStatusSchema = z.enum(['draft', 'active', 'closed', 'archived'])
export const employmentTypeSchema = z.enum(['full-time', 'part-time', 'contract', 'temporary'])
export const experienceLevelSchema = z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])
export const contractTypeSchema = z.enum(['w2', '1099', 'corp-to-corp', 'contract-to-hire'])

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  employmentType: employmentTypeSchema,
  experienceLevel: experienceLevelSchema.optional(),
  requiredSkills: z.array(z.string()).min(1, 'At least one required skill is needed'),
  preferredSkills: z.array(z.string()).default([]),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  hourlyRateMin: z.number().positive().optional(),
  hourlyRateMax: z.number().positive().optional(),
  contractType: contractTypeSchema.optional(),
  screeningQuestions: z.array(z.string()).default([]),
  intakeSummary: z.string().optional(),
  idealCandidateProfile: z.string().optional(),
  aiSuggestedQuestions: z.array(z.string()).optional(),
  status: jobStatusSchema.default('draft'),
})

export const aiIntakeSchema = z.object({
  jobTitle: z.string().min(3, 'Job title is required'),
  companyDescription: z.string().optional(),
  whatYouNeed: z.string().min(10, 'Describe what you need in this role'),
  keyResponsibilities: z.string().optional(),
  mustHaveSkills: z.array(z.string()).min(1, 'At least one must-have skill'),
  niceToHaveSkills: z.array(z.string()).default([]),
  experienceYears: z.number().int().min(0).max(30).optional(),
  workLocation: z.enum(['remote', 'hybrid', 'onsite']),
  budgetRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
})

export const aiIntakeResultSchema = z.object({
  intakeSummary: z.string().min(10),
  idealCandidateProfile: z.string().min(10),
  suggestedScreeningQuestions: z.array(z.string().min(3)).min(3).max(7),
})

export const updateJobSchema = createJobSchema.partial()

export type CreateJobInput = z.infer<typeof createJobSchema>
export type AIIntakeInput = z.infer<typeof aiIntakeSchema>
export type AIIntakeResult = z.infer<typeof aiIntakeResultSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type EmploymentType = z.infer<typeof employmentTypeSchema>
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>
export type ContractType = z.infer<typeof contractTypeSchema>
