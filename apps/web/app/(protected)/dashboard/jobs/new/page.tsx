'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ContractType,
  CreateJobInput,
  EmploymentType,
  ExperienceLevel,
} from '@hire-io/schemas'
import { Input, Textarea, Select, Badge, Button } from '@/components/ui'
import { submitJob } from './actions'

type WizardStep = 1 | 2 | 3 | 4

type JobFormState = {
  title: string
  location: string
  employmentType: EmploymentType | ''
  experienceLevel: ExperienceLevel | ''
  salaryMin: string
  salaryMax: string
  hourlyRateMin: string
  hourlyRateMax: string
  contractType: ContractType | ''
  description: string
  requiredSkills: string[]
  preferredSkills: string[]
}

const initialState: JobFormState = {
  title: '',
  location: '',
  employmentType: '',
  experienceLevel: '',
  salaryMin: '',
  salaryMax: '',
  hourlyRateMin: '',
  hourlyRateMax: '',
  contractType: '',
  description: '',
  requiredSkills: [],
  preferredSkills: [],
}

type FieldErrors = Partial<Record<keyof JobFormState | 'submit', string>>

const employmentTypes: EmploymentType[] = ['full-time', 'part-time', 'contract', 'temporary']
const experienceLevels: ExperienceLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive']
const contractTypes: ContractType[] = ['w2', '1099', 'corp-to-corp', 'contract-to-hire']

export default function NewJobPage() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [form, setForm] = useState<JobFormState>(initialState)
  const [requiredSkillDraft, setRequiredSkillDraft] = useState('')
  const [preferredSkillDraft, setPreferredSkillDraft] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, startSubmitTransition] = useTransition()

  const progress = useMemo(() => (step / 4) * 100, [step])

  const setField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined, submit: undefined }))
  }

  const addSkill = (field: 'requiredSkills' | 'preferredSkills', value: string) => {
    const normalized = value.trim()
    if (!normalized) return
    setForm(prev => {
      if (prev[field].includes(normalized)) return prev
      return { ...prev, [field]: [...prev[field], normalized] }
    })
    if (field === 'requiredSkills') setRequiredSkillDraft('')
    if (field === 'preferredSkills') setPreferredSkillDraft('')
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const removeSkill = (field: 'requiredSkills' | 'preferredSkills', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const parseNumber = (value: string) => {
    if (!value) return undefined
    const n = Number(value)
    return Number.isFinite(n) ? Math.round(n) : undefined
  }

  const validateStep = (current: WizardStep) => {
    const nextErrors: FieldErrors = {}

    if (current === 1) {
      if (!form.title.trim()) nextErrors.title = 'Title is required'
      if (!form.location.trim()) nextErrors.location = 'Location or remote policy is required'
      if (!form.employmentType) nextErrors.employmentType = 'Select an employment type'
    }

    if (current === 2) {
      const hasSalary = Boolean(form.salaryMin || form.salaryMax)
      const hasHourly = Boolean(form.hourlyRateMin || form.hourlyRateMax)
      if (!hasSalary && !hasHourly) {
        nextErrors.salaryMin = 'Provide salary or hourly compensation'
      }
      if (form.salaryMin && form.salaryMax && Number(form.salaryMin) > Number(form.salaryMax)) {
        nextErrors.salaryMax = 'Max salary must exceed min salary'
      }
      if (
        form.hourlyRateMin &&
        form.hourlyRateMax &&
        Number(form.hourlyRateMin) > Number(form.hourlyRateMax)
      ) {
        nextErrors.hourlyRateMax = 'Max hourly must exceed min hourly'
      }
      if (!form.contractType) nextErrors.contractType = 'Select a contract type'
    }

    if (current === 3) {
      if (!form.description.trim() || form.description.trim().length < 10) {
        nextErrors.description = 'Add a short description (10+ characters)'
      }
      if (form.requiredSkills.length === 0) {
        nextErrors.requiredSkills = 'Add at least one required skill'
      }
    }

    setErrors(prev => ({ ...prev, ...nextErrors, submit: undefined }))
    return Object.keys(nextErrors).length === 0
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep(prev => (prev < 4 ? ((prev + 1) as WizardStep) : prev))
    }
  }

  const goBack = () => setStep(prev => (prev > 1 ? ((prev - 1) as WizardStep) : prev))

  const handleSubmit = () => {
    const requiredSteps: WizardStep[] = [1, 2, 3]
    for (const s of requiredSteps) {
      if (!validateStep(s)) {
        setStep(s)
        return
      }
    }

    const payload: CreateJobInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      employmentType: form.employmentType as EmploymentType,
      experienceLevel: form.experienceLevel || undefined,
      requiredSkills: form.requiredSkills,
      preferredSkills: form.preferredSkills,
      salaryMin: parseNumber(form.salaryMin),
      salaryMax: parseNumber(form.salaryMax),
      hourlyRateMin: parseNumber(form.hourlyRateMin),
      hourlyRateMax: parseNumber(form.hourlyRateMax),
      contractType: (form.contractType || undefined) as ContractType | undefined,
      screeningQuestions: [],
      intakeSummary: undefined,
      idealCandidateProfile: undefined,
      aiSuggestedQuestions: undefined,
      status: 'draft',
    }

    startSubmitTransition(async () => {
      const result = await submitJob(payload)
      if (!result.success) {
        const nextErrors: FieldErrors = {}
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (!messages?.length) return
            if (field in form) {
              nextErrors[field as keyof JobFormState] = messages[0]
            }
          })
        }
        setErrors(prev => ({
          ...prev,
          ...nextErrors,
          submit: result.error || 'Unable to create job right now.',
        }))
        const firstField = Object.keys(nextErrors)[0]
        if (firstField) {
          const stepForField = fieldToStep(firstField as keyof JobFormState)
          if (stepForField) setStep(stepForField)
        }
        return
      }
      router.push('/dashboard/jobs?created=1')
    })
  }

  const reviewSummary = useMemo(
    () => [
      {
        title: 'Basics',
        rows: [
          `Title: ${form.title || '—'}`,
          `Location: ${form.location || '—'}`,
          `Employment: ${form.employmentType || '—'}`,
          `Experience: ${form.experienceLevel || 'Not specified'}`,
        ],
      },
      {
        title: 'Compensation',
        rows: [
          formatRange('Salary', parseNumber(form.salaryMin), parseNumber(form.salaryMax)),
          formatRange('Hourly', parseNumber(form.hourlyRateMin), parseNumber(form.hourlyRateMax)),
          `Contract Type: ${form.contractType || '—'}`,
        ],
      },
      {
        title: 'Description & Skills',
        rows: [
          `Description: ${form.description ? `${form.description.slice(0, 80)}...` : '—'}`,
          `Required Skills: ${
            form.requiredSkills.length ? form.requiredSkills.join(', ') : 'None added'
          }`,
          `Preferred Skills: ${
            form.preferredSkills.length ? form.preferredSkills.join(', ') : 'None added'
          }`,
        ],
      },
    ],
    [form],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Phase 1 · Job Builder</p>
            <h1 className="text-2xl font-bold text-slate-900">Create a Job</h1>
            <p className="text-sm text-slate-600">Capture basics, compensation, and description, then review.</p>
          </div>
          <div className="hidden h-2 w-40 rounded-full bg-slate-100 sm:block">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold text-blue-700 border-blue-200 bg-blue-50">
              {step}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {step === 1 && 'Basics'}
                {step === 2 && 'Compensation'}
                {step === 3 && 'Description & Skills'}
                {step === 4 && 'Review & Create'}
              </p>
              <p className="text-xs text-slate-500">
                {step === 1 && 'Role title, location, employment type'}
                {step === 2 && 'Salary or hourly range and contract type'}
                {step === 3 && 'Describe the role and list required skills'}
                {step === 4 && 'Confirm details and create the job'}
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500">{Math.round(progress)}% complete</div>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-800">Job Title *</label>
                <Input
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  placeholder="e.g., Senior Product Designer"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-800">Location / Remote *</label>
                  <Input
                    value={form.location}
                    onChange={e => setField('location', e.target.value)}
                    placeholder="Remote (US), NYC, Hybrid"
                    aria-invalid={Boolean(errors.location)}
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Employment Type *</label>
                  <Select
                    value={form.employmentType}
                    onChange={e => setField('employmentType', e.target.value as EmploymentType | '')}
                    aria-invalid={Boolean(errors.employmentType)}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('-', ' ')}
                      </option>
                    ))}
                  </Select>
                  {errors.employmentType && (
                    <p className="mt-1 text-sm text-red-600">{errors.employmentType}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">Experience Level</label>
                <Select
                  value={form.experienceLevel}
                  onChange={e => setField('experienceLevel', e.target.value as ExperienceLevel | '')}
                >
                  <option value="">Not specified</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-800">Salary Minimum</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.salaryMin}
                    onChange={e => setField('salaryMin', e.target.value)}
                    aria-invalid={Boolean(errors.salaryMin)}
                    placeholder="e.g. 120000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Salary Maximum</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.salaryMax}
                    onChange={e => setField('salaryMax', e.target.value)}
                    aria-invalid={Boolean(errors.salaryMax)}
                    placeholder="e.g. 150000"
                  />
                  {errors.salaryMax && <p className="mt-1 text-sm text-red-600">{errors.salaryMax}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-800">Hourly Minimum</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.hourlyRateMin}
                    onChange={e => setField('hourlyRateMin', e.target.value)}
                    aria-invalid={Boolean(errors.hourlyRateMin)}
                    placeholder="e.g. 70"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Hourly Maximum</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.hourlyRateMax}
                    onChange={e => setField('hourlyRateMax', e.target.value)}
                    aria-invalid={Boolean(errors.hourlyRateMax)}
                    placeholder="e.g. 90"
                  />
                  {errors.hourlyRateMax && <p className="mt-1 text-sm text-red-600">{errors.hourlyRateMax}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-800">Contract Type *</label>
                <Select
                  value={form.contractType}
                  onChange={e => setField('contractType', e.target.value as ContractType | '')}
                  aria-invalid={Boolean(errors.contractType)}
                >
                  <option value="" disabled>
                    Select contract type
                  </option>
                  {contractTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'corp-to-corp' ? 'Corp-to-Corp' : type.toUpperCase()}
                    </option>
                  ))}
                </Select>
                {errors.contractType && <p className="mt-1 text-sm text-red-600">{errors.contractType}</p>}
              </div>
              {errors.salaryMin && !errors.salaryMax && (
                <p className="text-sm text-red-600">{errors.salaryMin}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-800">Description *</label>
                <Textarea
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Summarize responsibilities, impact, and what success looks like."
                  aria-invalid={Boolean(errors.description)}
                  rows={6}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-800">Required Skills *</label>
                <div className="flex gap-3">
                  <Input
                    value={requiredSkillDraft}
                    onChange={e => setRequiredSkillDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill('requiredSkills', requiredSkillDraft)
                      }
                    }}
                    placeholder="Add a required skill"
                  />
                  <Button type="button" onClick={() => addSkill('requiredSkills', requiredSkillDraft)}>
                    Add
                  </Button>
                </div>
                {errors.requiredSkills && (
                  <p className="text-sm text-red-600">{errors.requiredSkills}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {form.requiredSkills.map((skill, index) => (
                    <Badge key={`${skill}-${index}`} variant="muted" className="gap-2">
                      {skill}
                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() => removeSkill('requiredSkills', index)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {form.requiredSkills.length === 0 && (
                    <p className="text-sm text-slate-500">No skills added yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-800">Preferred Skills</label>
                <div className="flex gap-3">
                  <Input
                    value={preferredSkillDraft}
                    onChange={e => setPreferredSkillDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill('preferredSkills', preferredSkillDraft)
                      }
                    }}
                    placeholder="Add a preferred skill"
                  />
                  <Button type="button" variant="outline" onClick={() => addSkill('preferredSkills', preferredSkillDraft)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.preferredSkills.map((skill, index) => (
                    <Badge key={`${skill}-${index}`} variant="muted" className="gap-2">
                      {skill}
                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() => removeSkill('preferredSkills', index)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {form.preferredSkills.length === 0 && (
                    <p className="text-sm text-slate-500">Optional — helps sourcing.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Review the summary below. You can go back to make edits before creating the job.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {reviewSummary.map(section => (
                  <div key={section.title} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {section.rows.map(row => (
                        <li key={row}>{row}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={goBack} disabled={step === 1 || isSubmitting}>
            Back
          </Button>
          <div className="flex gap-3">
            {step < 4 && (
              <Button onClick={goNext} disabled={isSubmitting}>
                Next
              </Button>
            )}
            {step === 4 && (
              <Button onClick={handleSubmit} disabled={isSubmitting} variant="default">
                {isSubmitting ? 'Creating…' : 'Create Job'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatRange(label: string, min?: number, max?: number) {
  if (!min && !max) return `${label}: Not specified`
  if (min && max) return `${label}: $${min.toLocaleString()} – $${max.toLocaleString()}`
  if (min) return `${label}: From $${min.toLocaleString()}`
  return `${label}: Up to $${max?.toLocaleString()}`
}

function fieldToStep(field: keyof JobFormState): WizardStep | undefined {
  const map: Partial<Record<keyof JobFormState, WizardStep>> = {
    title: 1,
    location: 1,
    employmentType: 1,
    experienceLevel: 1,
    salaryMin: 2,
    salaryMax: 2,
    hourlyRateMin: 2,
    hourlyRateMax: 2,
    contractType: 2,
    description: 3,
    requiredSkills: 3,
    preferredSkills: 3,
  }
  return map[field]
}
