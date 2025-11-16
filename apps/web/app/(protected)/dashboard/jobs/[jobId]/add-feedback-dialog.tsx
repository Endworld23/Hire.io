'use client'

import { useState, useTransition } from 'react'
import { addFeedbackAction } from './feedback-actions'

type Props = {
  applicationId: string
  jobId: string
}

export function AddFeedbackDialog({ applicationId, jobId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await addFeedbackAction(formData)
        setComment('')
        setRating('')
        setIsOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to submit feedback')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
      >
        Add feedback
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <input type="hidden" name="applicationId" value={applicationId} />
              <input type="hidden" name="jobId" value={jobId} />
              <div>
                <label className="text-sm font-medium text-gray-700">Rating (optional)</label>
                <select
                  name="rating"
                  value={rating}
                  onChange={event => setRating(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No rating</option>
                  {[1, 2, 3, 4, 5].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Comment</label>
                <textarea
                  name="comment"
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  rows={4}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
