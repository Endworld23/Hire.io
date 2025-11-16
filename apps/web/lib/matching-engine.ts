export type JobMatchProfile = {
  requiredSkills: string[]
  preferredSkills: string[]
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  leniency?: number // 0 strict, 1 lenient
}

export type CandidateMatchProfile = {
  skills: string[]
  yearsOfExperience?: number
}

const EXPERIENCE_MAP: Record<NonNullable<JobMatchProfile['experienceLevel']>, number> = {
  entry: 1,
  mid: 3,
  senior: 6,
  lead: 8,
  executive: 10,
}

export function calculateMatchScore(
  job: JobMatchProfile,
  candidate: CandidateMatchProfile,
): number {
  const normalizedJob = normalizeSkills(job.requiredSkills)
  const normalizedPreferred = normalizeSkills(job.preferredSkills || [])
  const normalizedCandidate = normalizeSkills(candidate.skills || [])

  const completedRequired = normalizedJob.filter(skill => normalizedCandidate.includes(skill)).length
  const requiredCoverage = normalizedJob.length
    ? completedRequired / normalizedJob.length
    : 1

  const preferredCoverage =
    normalizedPreferred.length > 0
      ? normalizedPreferred.filter(skill => normalizedCandidate.includes(skill)).length /
        normalizedPreferred.length
      : 0

  const targetYears = job.experienceLevel ? EXPERIENCE_MAP[job.experienceLevel] : 3
  const candidateYears = candidate.yearsOfExperience ?? targetYears
  const experienceScore = calculateExperienceScore(candidateYears, targetYears, job.leniency ?? 0.5)

  const requiredWeight = 0.55
  const preferredWeight = 0.2
  const experienceWeight = 0.25

  const totalScore =
    requiredCoverage * requiredWeight +
    preferredCoverage * preferredWeight +
    experienceScore * experienceWeight

  return Math.round(Math.min(Math.max(totalScore * 100, 0), 100))
}

function normalizeSkills(skills?: string[]) {
  return (skills || [])
    .map(skill => skill.trim().toLowerCase())
    .filter(Boolean)
}

function calculateExperienceScore(
  candidateYears: number,
  targetYears: number,
  leniency: number,
) {
  if (targetYears <= 0) return 1
  const ratio = candidateYears / targetYears
  if (ratio >= 1) {
    return Math.min(ratio, 2) / 2
  }
  const tolerance = 1 - Math.min(leniency, 0.9) * 0.5
  const adjusted = candidateYears / (targetYears * tolerance)
  return Math.max(Math.min(adjusted, 1), 0)
}
