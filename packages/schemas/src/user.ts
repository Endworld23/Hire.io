import { z } from 'zod'

export const roleSchema = z.enum(['admin', 'recruiter', 'client', 'candidate'])

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name is required'),
  role: roleSchema,
  metadata: z.record(z.unknown()).optional(),
})

export const updateUserSchema = userSchema.partial()

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: roleSchema,
  fullName: z.string().min(2, 'Full name is required'),
})

export type UserInput = z.infer<typeof userSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>
