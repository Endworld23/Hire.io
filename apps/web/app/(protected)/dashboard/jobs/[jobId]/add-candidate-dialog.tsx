'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addCandidateAction, type AddCandidateFormState } from './actions'
import { Input, Textarea } from '@/components/ui'

const initialState: AddCandidateFormState = {}

export function AddCandidateDialog({ jobId }: { jobId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useFormState(addCandidateAction, initialState)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setIsOpen(false)
    }
  }, [state?.success])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        + Add Candidate
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Candidate</h3>
                <p className="text-sm text-gray-500">Upload an anonymized candidate for this job.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} action={formAction} className="mt-6 space-y-5" encType="multipart/form-data">
              <input type="hidden" name="jobId" value={jobId} />

              <div>
                <label htmlFor="alias" className="text-sm font-medium text-gray-700">
                  Candidate Alias <span className="text-red-500">*</span>
                </label>
                <Input
                  id="alias"
                  name="alias"
                  placeholder="e.g. Product Manager #12"
                  aria-invalid={Boolean(state?.fieldErrors?.alias)}
                  required
                />
                {state?.fieldErrors?.alias && (
                  <p className="mt-1 text-sm text-red-600">{state.fieldErrors.alias}</p>
                )}
              </div>

              <div>
                <label htmlFor="headline" className="text-sm font-medium text-gray-700">
                  Headline / Notes
                </label>
                <Textarea
                  id="headline"
                  name="headline"
                  placeholder="Key strengths or short summary"
                  aria-invalid={Boolean(state?.fieldErrors?.headline)}
                />
                {state?.fieldErrors?.headline && (
                  <p className="mt-1 text-sm text-red-600">{state.fieldErrors.headline}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="desiredCompMin" className="text-sm font-medium text-gray-700">
                    Desired Comp (Min)
                  </label>
                  <Input
                    id="desiredCompMin"
                    name="desiredCompMin"
                    type="number"
                    min="0"
                    placeholder="e.g. 120000"
                    aria-invalid={Boolean(state?.fieldErrors?.desiredCompMin)}
                  />
                  {state?.fieldErrors?.desiredCompMin && (
                    <p className="mt-1 text-sm text-red-600">{state.fieldErrors.desiredCompMin}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="desiredCompMax" className="text-sm font-medium text-gray-700">
                    Desired Comp (Max)
                  </label>
                  <Input
                    id="desiredCompMax"
                    name="desiredCompMax"
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    aria-invalid={Boolean(state?.fieldErrors?.desiredCompMax)}
                  />
                  {state?.fieldErrors?.desiredCompMax && (
                    <p className="mt-1 text-sm text-red-600">{state.fieldErrors.desiredCompMax}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="resume" className="text-sm font-medium text-gray-700">
                  Resume (PDF or Word) <span className="text-red-500">*</span>
                </label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {state?.fieldErrors?.resume && (
                  <p className="mt-1 text-sm text-red-600">{state.fieldErrors.resume}</p>
                )}
              </div>

              {state?.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Saving...' : 'Save Candidate'}
    </button>
  )
}
