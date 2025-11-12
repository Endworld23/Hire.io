import type { Role } from './types'

export interface AuthUser {
  id: string
  email: string
  tenantId: string
  role: Role
  fullName: string | null
}

export function hasRole(user: AuthUser | null, allowedRoles: Role[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ['admin'])
}

export function isRecruiter(user: AuthUser | null): boolean {
  return hasRole(user, ['admin', 'recruiter'])
}

export function isClient(user: AuthUser | null): boolean {
  return hasRole(user, ['client'])
}

export function isCandidate(user: AuthUser | null): boolean {
  return hasRole(user, ['candidate'])
}
