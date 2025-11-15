'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/lib/actions/jobs'
import type { CreateJobInput, EmploymentType, ExperienceLevel } from '@hire-io/schemas'

type FormData = Partial<CreateJobInput>

const steps = [
  { id: 1, name: 'Basic Details', description: 'Job title, description, and location' },
  { id: 2, name: 'Requirements', description: 'Skills and experience needed' },
  { id: 3, name: 'Screening', description: 'Custom screening questions' },
  { id: 4, name: 'Compensation', description: 'Salary and contract details' },
  { id: 5, name: 'Review', description: 'Review and submit' },
]

export default function NewJobPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    requiredSkills: [],
    preferredSkills: [],
    screeningQuestions: [],
    status: 'draft',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.title || formData.title.length < 3) {
        newErrors.title = 'Title must be at least 3 characters'
      }
      if (!formData.description || formData.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters'
      }
      if (!formData.location || formData.location.length < 2) {
        newErrors.location = 'Location is required'
      }
      if (!formData.employmentType) {
        newErrors.employmentType = 'Employment type is required'
      }
    }

    if (step === 2) {
      if (!formData.requiredSkills || formData.requiredSkills.length === 0) {
        newErrors.requiredSkills = 'At least one required skill is needed'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      const result = await createJob(formData as CreateJobInput)

      if (result.error) {
        setErrors({ submit: result.error })
      } else {
        router.push('/dashboard/jobs')
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSkill = (type: 'requiredSkills' | 'preferredSkills', value: string) => {
    if (!value.trim()) return
    const skills = formData[type] || []
    if (!skills.includes(value.trim())) {
      updateFormData(type, [...skills, value.trim()])
    }
  }

  const removeSkill = (type: 'requiredSkills' | 'preferredSkills', index: number) => {
    const skills = formData[type] || []
    updateFormData(type, skills.filter((_, i) => i !== index))
  }

  const addQuestion = (value: string) => {
    if (!value.trim()) return
    const questions = formData.screeningQuestions || []
    updateFormData('screeningQuestions', [...questions, value.trim()])
  }

  const removeQuestion = (index: number) => {
    const questions = formData.screeningQuestions || []
    updateFormData('screeningQuestions', questions.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Job Opening</h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the details to create a new job posting
            </p>
          </div>

          {/* Stepper */}
          <nav aria-label="Progress" className="mb-8">
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => (
                <li key={step.id} className={`flex-1 ${index !== steps.length - 1 ? 'pr-8' : ''}`}>
                  <div className="flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          currentStep > step.id
                            ? 'border-blue-600 bg-blue-600'
                            : currentStep === step.id
                            ? 'border-blue-600 bg-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                            }`}
                          >
                            {step.id}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <span
                          className={`text-xs font-medium ${
                            currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                    </div>
                    {index !== steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 ${
                          currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>

          {/* Form Content */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Step 1: Basic Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      rows={6}
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Describe the role, responsibilities, and what success looks like..."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g. Remote, New York, NY, or Hybrid - San Francisco"
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                  </div>

                  <div>
                    <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                      Employment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="employmentType"
                      value={formData.employmentType || ''}
                      onChange={(e) => updateFormData('employmentType', e.target.value as EmploymentType)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                    </select>
                    {errors.employmentType && <p className="mt-1 text-sm text-red-600">{errors.employmentType}</p>}
                  </div>
                </div>
              )}

              {/* Step 2: Requirements */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                      Experience Level
                    </label>
                    <select
                      id="experienceLevel"
                      value={formData.experienceLevel || ''}
                      onChange={(e) => updateFormData('experienceLevel', e.target.value as ExperienceLevel)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select level</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Required Skills <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="requiredSkillInput"
                          placeholder="Type a skill and press Enter"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSkill('requiredSkills', e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('requiredSkillInput') as HTMLInputElement
                            addSkill('requiredSkills', input.value)
                            input.value = ''
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(formData.requiredSkills || []).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill('requiredSkills', index)}
                              className="ml-2 inline-flex items-center"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                      {errors.requiredSkills && <p className="mt-1 text-sm text-red-600">{errors.requiredSkills}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Preferred Skills
                    </label>
                    <div className="mt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="preferredSkillInput"
                          placeholder="Type a skill and press Enter"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSkill('preferredSkills', e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('preferredSkillInput') as HTMLInputElement
                            addSkill('preferredSkills', input.value)
                            input.value = ''
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(formData.preferredSkills || []).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill('preferredSkills', index)}
                              className="ml-2 inline-flex items-center"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Screening Questions */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Screening Questions
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Add questions that candidates will answer when applying
                    </p>
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="questionInput"
                          placeholder="Type a question and press Enter"
                          className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addQuestion(e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('questionInput') as HTMLInputElement
                            addQuestion(input.value)
                            input.value = ''
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {(formData.screeningQuestions || []).map((question, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{question}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="ml-3 text-gray-400 hover:text-red-600"
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {(formData.screeningQuestions || []).length === 0 && (
                          <p className="text-sm text-gray-500 italic">No screening questions added yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Compensation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700">
                        Minimum Salary
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="salaryMin"
                          value={formData.salaryMin || ''}
                          onChange={(e) => updateFormData('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="50000"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700">
                        Maximum Salary
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          id="salaryMax"
                          value={formData.salaryMax || ''}
                          onChange={(e) => updateFormData('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="80000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Compensation ranges are optional but help attract qualified candidates
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Review Job Details</h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Basic Details</h4>
                        <dl className="mt-2 space-y-1">
                          <div className="flex">
                            <dt className="text-sm text-gray-500 w-32">Title:</dt>
                            <dd className="text-sm text-gray-900">{formData.title}</dd>
                          </div>
                          <div className="flex">
                            <dt className="text-sm text-gray-500 w-32">Location:</dt>
                            <dd className="text-sm text-gray-900">{formData.location}</dd>
                          </div>
                          <div className="flex">
                            <dt className="text-sm text-gray-500 w-32">Type:</dt>
                            <dd className="text-sm text-gray-900">{formData.employmentType}</dd>
                          </div>
                          {formData.experienceLevel && (
                            <div className="flex">
                              <dt className="text-sm text-gray-500 w-32">Experience:</dt>
                              <dd className="text-sm text-gray-900">{formData.experienceLevel}</dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Description</h4>
                        <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{formData.description}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Required Skills</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(formData.requiredSkills || []).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {(formData.preferredSkills || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Preferred Skills</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(formData.preferredSkills || []).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(formData.screeningQuestions || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Screening Questions</h4>
                          <ol className="mt-2 list-decimal list-inside space-y-1">
                            {(formData.screeningQuestions || []).map((question, index) => (
                              <li key={index} className="text-sm text-gray-900">{question}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {(formData.salaryMin || formData.salaryMax) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Compensation</h4>
                          <p className="mt-2 text-sm text-gray-900">
                            ${formData.salaryMin?.toLocaleString() || '—'} - ${formData.salaryMax?.toLocaleString() || '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between rounded-b-lg">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Job'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
