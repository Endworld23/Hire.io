'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ContractType, CreateJobInput, EmploymentType, ExperienceLevel } from '@hire-io/schemas'
import { Input, Textarea, Select, Badge } from '@/components/ui'
import { updateJobAction } from '../job-actions'

type JobEditFormValues = {
  title: string
  description: string
  location: string
  employmentType: EmploymentType | ''
  experienceLevel: ExperienceLevel | ''
  requiredSkills: string[]
  preferredSkills: string[]
  screeningQuestions: string[]
  salaryMin: string
  salaryMax: string
  hourlyRateMin: string
  hourlyRateMax: string
  contractType: ContractType | ''
  intakeSummary: string
  idealCandidateProfile: string
  aiSuggestedQuestionsText: string
  status: CreateJobInput['status']
}

type Props = {
  jobId: string
  initialValues: JobEditFormValues
}

export function JobEditForm({ jobId, initialValues }: Props) {
  const router = useRouter()
  const [formState, setFormState] = useState(initialValues)
  const [requiredSkillDraft, setRequiredSkillDraft] = useState('')
  const [preferredSkillDraft, setPreferredSkillDraft] = useState('')
  const [questionDraft, setQuestionDraft] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, startTransition] = useTransition()

  const setField = <K extends keyof JobEditFormValues>(field: K, value: JobEditFormValues[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFormError(null)

    const payload: CreateJobInput = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      employmentType: formState.employmentType || 'full-time',
      experienceLevel: formState.experienceLevel || undefined,
      requiredSkills: formState.requiredSkills,
      preferredSkills: formState.preferredSkills,
      salaryMin: parseNumber(formState.salaryMin),
      salaryMax: parseNumber(formState.salaryMax),
      hourlyRateMin: parseNumber(formState.hourlyRateMin),
      hourlyRateMax: parseNumber(formState.hourlyRateMax),
      contractType: formState.contractType || undefined,
      screeningQuestions: formState.screeningQuestions,
      intakeSummary: formState.intakeSummary || undefined,
      idealCandidateProfile: formState.idealCandidateProfile || undefined,
      aiSuggestedQuestions: serializeList(formState.aiSuggestedQuestionsText),
      status: formState.status || 'draft',
    }

    startTransition(async () => {
      const result = await updateJobAction(jobId, payload)
      if (!result.success) {
        if (result.fieldErrors) {
          const mapped: Record<string, string> = {}
          for (const [key, value] of Object.entries(result.fieldErrors)) {
            if (value && value.length) {
              mapped[key] = value[0]
            }
          }
          setErrors(mapped)
        }
        setFormError(result.error || 'Unable to update job right now.')
        return
      }

      router.push(`/dashboard/jobs/${jobId}`)
      router.refresh()
    })
  }

  const addSkill = (field: 'requiredSkills' | 'preferredSkills', value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setFormState(prev => {
      if (prev[field].includes(trimmed)) return prev
      return { ...prev, [field]: [...prev[field], trimmed] }
    })
    if (field === 'requiredSkills') {
      setRequiredSkillDraft('')
    } else {
      setPreferredSkillDraft('')
    }
  }

  const removeSkill = (field: 'requiredSkills' | 'preferredSkills', index: number) => {
    setFormState(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addScreeningQuestion = () => {
    const trimmed = questionDraft.trim()
    if (!trimmed) return
    setFormState(prev => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, trimmed],
    }))
    setQuestionDraft('')
  }

  const removeScreeningQuestion = (index: number) => {
    setFormState(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">Job Title</label>
          <Input
            value={formState.title}
            onChange={(event) => setField('title', event.target.value)}
            aria-invalid={Boolean(errors.title)}
            required
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <Textarea
            value={formState.description}
            onChange={(event) => setField('description', event.target.value)}
            rows={6}
            aria-invalid={Boolean(errors.description)}
            required
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Location</label>
            <Input
              value={formState.location}
              onChange={(event) => setField('location', event.target.value)}
              aria-invalid={Boolean(errors.location)}
              required
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
          <div>
          <label className="text-sm font-medium text-gray-700">Job Status</label>
          <Select
            value={formState.status}
            onChange={(event) => setField('status', event.target.value as CreateJobInput['status'])}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Employment Type</label>
            <Select
              value={formState.employmentType}
              onChange={(event) => setField('employmentType', event.target.value as EmploymentType)}
            >
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Experience Level</label>
            <Select
              value={formState.experienceLevel}
              onChange={(event) => setField('experienceLevel', event.target.value as ExperienceLevel)}
            >
              <option value="">Not specified</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">Required Skills</label>
          <div className="mt-2 flex gap-2">
            <Input
              value={requiredSkillDraft}
              onChange={(event) => setRequiredSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSkill('requiredSkills', requiredSkillDraft)
                }
              }}
              placeholder="Add a skill and press Enter"
            />
            <button
              type="button"
              onClick={() => addSkill('requiredSkills', requiredSkillDraft)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {formState.requiredSkills.map((skill, index) => (
              <Badge key={`${skill}-${index}`} className="gap-2 bg-blue-100 text-blue-800">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill('requiredSkills', index)}
                  className="ml-2 text-xs text-blue-700 hover:text-blue-900"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Preferred Skills</label>
          <div className="mt-2 flex gap-2">
            <Input
              value={preferredSkillDraft}
              onChange={(event) => setPreferredSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addSkill('preferredSkills', preferredSkillDraft)
                }
              }}
              placeholder="Add a skill and press Enter"
            />
            <button
              type="button"
              onClick={() => addSkill('preferredSkills', preferredSkillDraft)}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {formState.preferredSkills.map((skill, index) => (
              <Badge key={`${skill}-${index}`} variant="muted">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill('preferredSkills', index)}
                  className="ml-2 text-xs text-gray-600 hover:text-gray-800"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Salary Min (USD)</label>
            <Input
              value={formState.salaryMin}
              onChange={(event) => setField('salaryMin', event.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 120000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Salary Max (USD)</label>
            <Input
              value={formState.salaryMax}
              onChange={(event) => setField('salaryMax', event.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 150000"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Hourly Min (USD)</label>
            <Input
              value={formState.hourlyRateMin}
              onChange={(event) => setField('hourlyRateMin', event.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 70"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Hourly Max (USD)</label>
            <Input
              value={formState.hourlyRateMax}
              onChange={(event) => setField('hourlyRateMax', event.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 90"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Contract Type</label>
          <Select
            value={formState.contractType}
            onChange={(event) => setField('contractType', event.target.value as ContractType | '')}
          >
            <option value="">Not specified</option>
            <option value="w2">W2</option>
            <option value="1099">1099</option>
            <option value="corp-to-corp">Corp-to-Corp</option>
            <option value="contract-to-hire">Contract-to-Hire</option>
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">Screening Questions</label>
          <div className="mt-2 flex gap-2">
            <Input
              value={questionDraft}
              onChange={(event) => setQuestionDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addScreeningQuestion()
                }
              }}
              placeholder="Add a screening question"
            />
            <button
              type="button"
              onClick={addScreeningQuestion}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {formState.screeningQuestions.map((question, index) => (
              <div
                key={`${question}-${index}`}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                <span className="flex-1">{question}</span>
                <button
                  type="button"
                  onClick={() => removeScreeningQuestion(index)}
                  className="ml-3 text-gray-400 hover:text-gray-600"
                >
                  Remove
                </button>
              </div>
            ))}
            {formState.screeningQuestions.length === 0 && (
              <p className="text-sm text-gray-500">No screening questions yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">AI Intake Summary</label>
          <Textarea
            value={formState.intakeSummary}
            onChange={(event) => setField('intakeSummary', event.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Ideal Candidate Profile</label>
          <Textarea
            value={formState.idealCandidateProfile}
            onChange={(event) => setField('idealCandidateProfile', event.target.value)}
            rows={3}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">AI Suggested Screening Questions</label>
          <Textarea
            value={formState.aiSuggestedQuestionsText}
            onChange={(event) => setField('aiSuggestedQuestionsText', event.target.value)}
            rows={4}
            placeholder="One question per line"
          />
        </div>
      </section>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

function parseNumber(value: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function serializeList(value: string) {
  return value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}
