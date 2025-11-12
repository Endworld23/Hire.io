import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  subdomain: z.string().min(3, 'Subdomain must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  settings: z.record(z.unknown()).optional(),
})

export const updateTenantSchema = tenantSchema.partial()

export type TenantInput = z.infer<typeof tenantSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
