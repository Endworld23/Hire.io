'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ContractType,
  CreateJobInput,
  EmploymentType,
  ExperienceLevel,
} from '@hire-io/schemas'
import { Input, Textarea, Select, Badge } from '@/components/ui'
import { submitJob, generateIntakeSuggestions } from './actions'
import type { AIIntakeInput } from '@hire-io/schemas'

const steps = [
  { id: 1, title: 'Basic Details', description: 'Role basics and employment info' },
  { id: 2, title: 'Requirements', description: 'Skills and experience expectations' },
  { id: 3, title: 'AI Intake Summary', description: 'Refine the role with AI assistance' },
  { id: 4, title: 'Screening', description: 'Questions candidates must answer' },
  { id: 5, title: 'Compensation', description: 'Salary, hourly, and contract terms' },
  { id: 6, title: 'Review & Submit', description: 'Verify details before publishing' },
]

const employmentTypes: EmploymentType[] = ['full-time', 'part-time', 'contract', 'temporary']
const experienceLevels: ExperienceLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive']
const contractTypes: ContractType[] = ['w2', '1099', 'corp-to-corp', 'contract-to-hire']

type JobFormState = {
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
  status: CreateJobInput['status']
  intakeSummary: string
  idealCandidateProfile: string
  aiSuggestedQuestions: string[]
}

const initialState: JobFormState = {
  title: '',
  description: '',
  location: '',
  employmentType: '',
  experienceLevel: '',
  requiredSkills: [],
  preferredSkills: [],
  screeningQuestions: [],
  salaryMin: '',
  salaryMax: '',
  hourlyRateMin: '',
  hourlyRateMax: '',
  contractType: '',
  status: 'draft',
  intakeSummary: '',
  idealCandidateProfile: '',
  aiSuggestedQuestions: [],
}

type FieldErrors = Partial<Record<keyof JobFormState | 'submit', string>>

const jobFieldKeys = Object.keys(initialState) as (keyof JobFormState)[]
const jobFieldKeySet = new Set<keyof JobFormState>(jobFieldKeys)

const fieldStepLookup: Record<keyof JobFormState, number> = {
  title: 1,
  description: 1,
  location: 1,
  employmentType: 1,
  experienceLevel: 2,
  requiredSkills: 2,
  preferredSkills: 2,
  intakeSummary: 3,
  idealCandidateProfile: 3,
  aiSuggestedQuestions: 3,
  screeningQuestions: 4,
  salaryMin: 5,
  salaryMax: 5,
  hourlyRateMin: 5,
  hourlyRateMax: 5,
  contractType: 5,
  status: 6,
}

const toNumber = (value: string): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatCurrencyRange = (label: string, min?: number, max?: number) => {
  if (!min && !max) return `${label}: Not specified`
  if (min && max) return `${label}: $${min.toLocaleString()} – $${max.toLocaleString()}`
  if (min) return `${label}: From $${min.toLocaleString()}`
  return `${label}: Up to $${max!.toLocaleString()}`
}

const normalizeListItem = (value: string) => value.trim().replace(/\s+/g, ' ')

export default function NewJobPage() {
  // Phase 1 – Core ATS (Job Builder) – see /docs/roadmap.md §Phase 1
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formState, setFormState] = useState<JobFormState>(initialState)
  const [requiredSkillDraft, setRequiredSkillDraft] = useState('')
  const [preferredSkillDraft, setPreferredSkillDraft] = useState('')
  const [questionDraft, setQuestionDraft] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [aiError, setAiError] = useState<string | null>(null)
  const [isGenerating, startGenerateTransition] = useTransition()
  const [isSubmitting, startSubmitTransition] = useTransition()

  const setFieldValue = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined, submit: undefined }))
  }

  const addListItem = (field: 'requiredSkills' | 'preferredSkills' | 'screeningQuestions', value: string) => {
    const normalized = normalizeListItem(value)
    if (!normalized) return
    setFormState(prev => {
      if (prev[field].includes(normalized)) return prev
      return { ...prev, [field]: [...prev[field], normalized] }
    })
  }

  const removeListItem = (
    field: 'requiredSkills' | 'preferredSkills' | 'screeningQuestions',
    index: number,
  ) => {
    setFormState(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const validateStep = (step: number) => {
    const newErrors: FieldErrors = {}

    if (step === 1) {
      if (!formState.title || formState.title.trim().length < 3) {
        newErrors.title = 'Enter a descriptive job title'
      }
      if (!formState.description || formState.description.trim().length < 10) {
        newErrors.description = 'Add a short description of the role'
      }
      if (!formState.location || formState.location.trim().length < 2) {
        newErrors.location = 'Location or remote designation is required'
      }
      if (!formState.employmentType) {
        newErrors.employmentType = 'Select an employment type'
      }
    }

    if (step === 2) {
      if (formState.requiredSkills.length === 0) {
        newErrors.requiredSkills = 'List at least one required skill'
      }
    }

    if (step === 5) {
      const hasSalary = Boolean(formState.salaryMin || formState.salaryMax)
      const hasHourly = Boolean(formState.hourlyRateMin || formState.hourlyRateMax)

      if (!hasSalary && !hasHourly) {
        newErrors.salaryMin = 'Provide salary or hourly compensation details'
      }

      if (formState.salaryMin && formState.salaryMax && Number(formState.salaryMin) > Number(formState.salaryMax)) {
        newErrors.salaryMax = 'Max salary must be greater than min salary'
      }

      if (
        formState.hourlyRateMin &&
        formState.hourlyRateMax &&
        Number(formState.hourlyRateMin) > Number(formState.hourlyRateMax)
      ) {
        newErrors.hourlyRateMax = 'Max hourly rate must be greater than min hourly rate'
      }

      if (!formState.contractType) {
        newErrors.contractType = 'Select a contract type'
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors, submit: undefined }))
    return Object.keys(newErrors).length === 0
  }

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    const stepsToValidate = [1, 2, 5]
    setErrors(prev => ({ ...prev, submit: undefined }))
    const validations = stepsToValidate.map(step => ({ step, valid: validateStep(step) }))
    const firstInvalid = validations.find(result => !result.valid)
    if (firstInvalid) {
      setCurrentStep(firstInvalid.step)
      return
    }

    const payload: CreateJobInput = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      employmentType: formState.employmentType as EmploymentType,
      experienceLevel: formState.experienceLevel || undefined,
      requiredSkills: formState.requiredSkills,
      preferredSkills: formState.preferredSkills,
      salaryMin: toNumber(formState.salaryMin),
      salaryMax: toNumber(formState.salaryMax),
      hourlyRateMin: toNumber(formState.hourlyRateMin),
      hourlyRateMax: toNumber(formState.hourlyRateMax),
      contractType: (formState.contractType || undefined) as ContractType | undefined,
      screeningQuestions: formState.screeningQuestions,
      intakeSummary: formState.intakeSummary || undefined,
      idealCandidateProfile: formState.idealCandidateProfile || undefined,
      aiSuggestedQuestions: formState.aiSuggestedQuestions.length ? formState.aiSuggestedQuestions : undefined,
      status: formState.status,
    }

    startSubmitTransition(async () => {
      const result = await submitJob(payload)

      if (!result.success) {
        const nextErrors = mapServerFieldErrors(result.fieldErrors)
        setErrors(prev => ({
          ...prev,
          ...nextErrors,
          submit: result.error || 'Unable to create job. Please review highlighted fields.',
        }))

        const nextStep = getFirstErrorStep(nextErrors)
        if (nextStep) {
          setCurrentStep(nextStep)
        }
        return
      }

      router.push('/dashboard/jobs?created=1')
    })
  }

  const handleGenerateIntake = () => {
    if (!formState.title || !formState.description || formState.requiredSkills.length === 0) {
      setAiError('Complete basic details and required skills before generating.')
      return
    }
    setAiError(null)
    const payload = buildAIIntakePayload(formState)

    startGenerateTransition(async () => {
      const result = await generateIntakeSuggestions(payload)
      if ('fieldErrors' in result) {
        setAiError('Provide more detail before running the AI intake step.')
        return
      }
      if ('success' in result && result.success) {
        setFieldValue('intakeSummary', result.result.intakeSummary)
        setFieldValue('idealCandidateProfile', result.result.idealCandidateProfile)
        setFieldValue('aiSuggestedQuestions', result.result.suggestedScreeningQuestions)
      } else {
        setAiError(result.error || 'Unable to generate AI intake summary right now.')
      }
    })
  }

  const applySuggestedQuestions = () => {
    if (!formState.aiSuggestedQuestions.length) return
    setFieldValue('screeningQuestions', formState.aiSuggestedQuestions)
    setCurrentStep(4)
  }

  const reviewData = useMemo(() => {
    return [
      {
        heading: 'Basic Details',
        items: [
          `Title: ${formState.title || 'Not provided'}`,
          `Location: ${formState.location || 'Not provided'}`,
          `Employment Type: ${formState.employmentType || 'Not provided'}`,
        ],
      },
      {
        heading: 'Requirements',
        items: [
          `Experience Level: ${formState.experienceLevel || 'Not provided'}`,
          `Required Skills: ${formState.requiredSkills.length ? formState.requiredSkills.join(', ') : 'None'}`,
          `Preferred Skills: ${formState.preferredSkills.length ? formState.preferredSkills.join(', ') : 'None'}`,
        ],
      },
      {
        heading: 'AI Intake',
        items: [
          `Summary: ${formState.intakeSummary || 'Not generated'}`,
          `Ideal Profile: ${formState.idealCandidateProfile || 'Not generated'}`,
          `AI Questions: ${
            formState.aiSuggestedQuestions.length ? formState.aiSuggestedQuestions.join(' • ') : 'Not generated'
          }`,
        ],
      },
      {
        heading: 'Screening',
        items: [
          `Questions: ${formState.screeningQuestions.length ? formState.screeningQuestions.join(' • ') : 'None'}`,
        ],
      },
      {
        heading: 'Compensation',
        items: [
          formatCurrencyRange('Salary Range', toNumber(formState.salaryMin), toNumber(formState.salaryMax)),
          formatCurrencyRange('Hourly Range', toNumber(formState.hourlyRateMin), toNumber(formState.hourlyRateMax)),
          `Contract Type: ${formState.contractType || 'Not specified'}`,
        ],
      },
    ]
  }, [formState])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Create a Job Requisition</h1>
          <p className="mt-2 text-sm text-gray-600">
            Collect all critical details so the team and AI assistant can source the right candidates.
          </p>
        </div>

        <div className="mb-10">
          <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
            {steps.map((step, index) => (
              <li key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        currentStep > step.id
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : currentStep === step.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-gray-300 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          currentStep >= step.id ? 'text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index !== steps.length - 1 && (
                    <div className="hidden flex-1 border-b border-dashed border-gray-200 sm:mx-6 sm:block" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="p-6 space-y-6">
            {currentStep === 1 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Details</h2>
                  <p className="text-sm text-gray-500">
                    Define the role so recruiters and hiring managers stay aligned.
                  </p>
                </header>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="title"
                      value={formState.title}
                      onChange={event => setFieldValue('title', event.target.value)}
                      placeholder="e.g. Senior Product Designer"
                      aria-invalid={Boolean(errors.title)}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="description"
                      value={formState.description}
                      onChange={event => setFieldValue('description', event.target.value)}
                      placeholder="Summarize the role, responsibilities, and success criteria..."
                      aria-invalid={Boolean(errors.description)}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location or Remote Policy <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="location"
                        value={formState.location}
                        onChange={event => setFieldValue('location', event.target.value)}
                        placeholder="e.g. Remote (US), New York HQ, Hybrid - SF"
                        aria-invalid={Boolean(errors.location)}
                      />
                      {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                    </div>

                    <div>
                      <label htmlFor="employmentType" className="text-sm font-medium text-gray-700">
                        Employment Type <span className="text-red-500">*</span>
                      </label>
                      <Select
                        id="employmentType"
                        value={formState.employmentType}
                        onChange={event => setFieldValue('employmentType', event.target.value as EmploymentType | '')}
                        placeholder="Select type"
                        aria-invalid={Boolean(errors.employmentType)}
                      >
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
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
                  <p className="text-sm text-gray-500">
                    Outline the skills and seniority needed for success in this role.
                  </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experienceLevel" className="text-sm font-medium text-gray-700">
                      Experience Level
                    </label>
                    <Select
                      id="experienceLevel"
                      value={formState.experienceLevel}
                      onChange={event => setFieldValue('experienceLevel', event.target.value as ExperienceLevel | '')}
                      placeholder="Select experience"
                    >
                      {experienceLevels.map(level => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <Input
                      value={requiredSkillDraft}
                      onChange={event => setRequiredSkillDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addListItem('requiredSkills', requiredSkillDraft)
                          setRequiredSkillDraft('')
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                      aria-invalid={Boolean(errors.requiredSkills)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addListItem('requiredSkills', requiredSkillDraft)
                        setRequiredSkillDraft('')
                      }}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Add
                    </button>
                  </div>
                  {errors.requiredSkills && (
                    <p className="text-sm text-red-600">{errors.requiredSkills}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formState.requiredSkills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} className="gap-2 bg-blue-100 text-blue-800">
                        {skill}
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() => removeListItem('requiredSkills', index)}
                          className="ml-1 text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Preferred Skills</label>
                  <div className="flex gap-3">
                    <Input
                      value={preferredSkillDraft}
                      onChange={event => setPreferredSkillDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addListItem('preferredSkills', preferredSkillDraft)
                          setPreferredSkillDraft('')
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addListItem('preferredSkills', preferredSkillDraft)
                        setPreferredSkillDraft('')
                      }}
                      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formState.preferredSkills.map((skill, index) => (
                      <Badge key={`${skill}-${index}`} variant="muted" className="gap-2">
                        {skill}
                        <button
                          type="button"
                          aria-label={`Remove ${skill}`}
                          onClick={() => removeListItem('preferredSkills', index)}
                          className="ml-1 text-gray-600 hover:text-gray-800"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">AI Intake Summary</h2>
                  <p className="text-sm text-gray-500">
                    Generate an ideal candidate profile and refined screening prompts. All prompts exclude PII per
                    /docs/security-and-eeo.md.
                  </p>
                </header>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGenerateIntake}
                    disabled={isGenerating}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating with AI…' : 'Run AI Intake Summary'}
                  </button>
                  {aiError && <p className="text-sm text-red-600">{aiError}</p>}

                  <div>
                    <label className="text-sm font-medium text-gray-700">AI Summary</label>
                    <Textarea
                      value={formState.intakeSummary}
                      onChange={event => setFieldValue('intakeSummary', event.target.value)}
                      placeholder="AI summary will appear here. You can edit as needed."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ideal Candidate Profile</label>
                    <Textarea
                      value={formState.idealCandidateProfile}
                      onChange={event => setFieldValue('idealCandidateProfile', event.target.value)}
                      placeholder="AI ideal candidate profile"
                    />
                  </div>

                  {formState.aiSuggestedQuestions.length > 0 && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">AI Suggested Screening Questions</p>
                        <button
                          type="button"
                          onClick={applySuggestedQuestions}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Apply to Screening Step
                        </button>
                      </div>
                      <ol className="mt-3 space-y-2 text-sm text-gray-700">
                        {formState.aiSuggestedQuestions.map((question, index) => (
                          <li key={`${question}-${index}`} className="list-decimal pl-4">
                            {question}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </section>
            )}

            {currentStep === 4 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">Screening Questions</h2>
                  <p className="text-sm text-gray-500">Collect structured responses during application intake.</p>
                </header>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Questions</label>
                  <div className="flex gap-3">
                    <Input
                      value={questionDraft}
                      onChange={event => setQuestionDraft(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addListItem('screeningQuestions', questionDraft)
                          setQuestionDraft('')
                        }
                      }}
                      placeholder="What makes you excited about this role?"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addListItem('screeningQuestions', questionDraft)
                        setQuestionDraft('')
                      }}
                      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tip: keep questions short and aligned to success metrics for EEO-friendly screening.
                  </p>
                  <div className="space-y-2">
                    {formState.screeningQuestions.map((question, index) => (
                      <div
                        key={`${question}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      >
                        <span className="flex-1">{question}</span>
                        <button
                          type="button"
                          aria-label={`Remove question ${index + 1}`}
                          onClick={() => removeListItem('screeningQuestions', index)}
                          className="ml-3 text-gray-400 hover:text-gray-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formState.screeningQuestions.length === 0 && (
                      <p className="text-sm text-gray-500">No custom screening questions added yet.</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {currentStep === 5 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">Compensation</h2>
                  <p className="text-sm text-gray-500">
                    Provide salary or hourly ranges to guide recruiters and candidates.
                  </p>
                </header>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="salaryMin" className="text-sm font-medium text-gray-700">
                      Salary Minimum (USD)
                    </label>
                    <Input
                      id="salaryMin"
                      type="number"
                      min="0"
                      value={formState.salaryMin}
                      onChange={event => setFieldValue('salaryMin', event.target.value)}
                      aria-invalid={Boolean(errors.salaryMin)}
                      placeholder="e.g. 120000"
                    />
                  </div>
                  <div>
                    <label htmlFor="salaryMax" className="text-sm font-medium text-gray-700">
                      Salary Maximum (USD)
                    </label>
                    <Input
                      id="salaryMax"
                      type="number"
                      min="0"
                      value={formState.salaryMax}
                      onChange={event => setFieldValue('salaryMax', event.target.value)}
                      aria-invalid={Boolean(errors.salaryMax)}
                      placeholder="e.g. 150000"
                    />
                    {errors.salaryMax && <p className="mt-1 text-sm text-red-600">{errors.salaryMax}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="hourlyRateMin" className="text-sm font-medium text-gray-700">
                      Hourly Rate Minimum (USD)
                    </label>
                    <Input
                      id="hourlyRateMin"
                      type="number"
                      min="0"
                      value={formState.hourlyRateMin}
                      onChange={event => setFieldValue('hourlyRateMin', event.target.value)}
                      aria-invalid={Boolean(errors.hourlyRateMin)}
                      placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label htmlFor="hourlyRateMax" className="text-sm font-medium text-gray-700">
                      Hourly Rate Maximum (USD)
                    </label>
                    <Input
                      id="hourlyRateMax"
                      type="number"
                      min="0"
                      value={formState.hourlyRateMax}
                      onChange={event => setFieldValue('hourlyRateMax', event.target.value)}
                      aria-invalid={Boolean(errors.hourlyRateMax)}
                      placeholder="e.g. 90"
                    />
                    {errors.hourlyRateMax && <p className="mt-1 text-sm text-red-600">{errors.hourlyRateMax}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="contractType" className="text-sm font-medium text-gray-700">
                    Contract Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="contractType"
                    value={formState.contractType}
                    onChange={event => setFieldValue('contractType', event.target.value as ContractType | '')}
                    placeholder="Select contract type"
                    aria-invalid={Boolean(errors.contractType)}
                  >
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
              </section>
            )}

            {currentStep === 6 && (
              <section className="space-y-6">
                <header>
                  <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
                  <p className="text-sm text-gray-500">
                    Confirm that the information is accurate before saving to the ATS.
                  </p>
                </header>

                <div className="space-y-4">
                  {reviewData.map(section => (
                    <div key={section.heading} className="rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900">{section.heading}</h3>
                      <ul className="mt-2 space-y-1 text-sm text-gray-600">
                        {section.items.map(item => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500">
                  Saving will log an auditable event per /docs/security-and-eeo.md and enforce tenant isolation.
                </p>

                {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
              </section>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={currentStep === 1 || isSubmitting}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex gap-3">
            {currentStep < steps.length && (
              <button
                type="button"
                onClick={goToNextStep}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {currentStep === steps.length && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Submit Job'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function mapServerFieldErrors(fieldErrors?: Record<string, string[] | undefined>): FieldErrors {
  if (!fieldErrors) return {}

  const mapped: FieldErrors = {}

  Object.entries(fieldErrors).forEach(([field, messages]) => {
    if (!messages?.length) return
    if (isJobField(field)) {
      mapped[field] = messages[0]
    }
  })

  return mapped
}

function isJobField(field: string): field is keyof JobFormState {
  return jobFieldKeySet.has(field as keyof JobFormState)
}

function getFirstErrorStep(fieldErrors: FieldErrors): number | undefined {
  const fieldKeys = Object.keys(fieldErrors).filter(key => key !== 'submit') as (keyof JobFormState)[]
  if (!fieldKeys.length) return undefined

  const stepNumbers = fieldKeys.map(key => fieldStepLookup[key] ?? steps.length)
  return stepNumbers.length ? Math.min(...stepNumbers) : undefined
}

function buildAIIntakePayload(form: JobFormState): AIIntakeInput {
  return {
    jobTitle: form.title || 'New Role',
    companyDescription: 'Confidential agency client',
    whatYouNeed: form.description || 'Role description pending.',
    keyResponsibilities: form.requiredSkills.slice(0, 5).join(', '),
    mustHaveSkills: form.requiredSkills,
    niceToHaveSkills: form.preferredSkills,
    experienceYears: mapExperienceToYears(form.experienceLevel),
    workLocation: deriveWorkLocation(form.location),
    budgetRange: {
      min: parseNumberOrUndefined(form.salaryMin),
      max: parseNumberOrUndefined(form.salaryMax),
    },
  }
}

function deriveWorkLocation(location: string): AIIntakeInput['workLocation'] {
  const normalized = location.toLowerCase()
  if (normalized.includes('hybrid')) return 'hybrid'
  if (normalized.includes('remote')) return 'remote'
  return 'onsite'
}

function mapExperienceToYears(level: ExperienceLevel | '') {
  switch (level) {
    case 'entry':
      return 1
    case 'mid':
      return 3
    case 'senior':
      return 6
    case 'lead':
      return 8
    case 'executive':
      return 10
    default:
      return undefined
  }
}

function parseNumberOrUndefined(value: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
