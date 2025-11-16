'use client'

import { useState, useTransition } from 'react'
import { updateShortlistDecision } from './actions'

type Props = {
  jobId: string
  applicationId: string
  currentStage: 'under_review' | 'shortlisted' | 'rejected'
}

export function ShortlistCardActions({ jobId, applicationId, currentStage }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDecision = (decision: 'shortlist' | 'reject') => {
    startTransition(async () => {
      const result = await updateShortlistDecision({ jobId, applicationId, decision })
      if (result?.error) {
        setError(result.error)
      } else {
        setError(null)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleDecision('shortlist')}
          disabled={isPending || currentStage === 'shortlisted'}
          className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Shortlist
        </button>
        <button
          type="button"
          onClick={() => handleDecision('reject')}
          disabled={isPending || currentStage === 'rejected'}
          className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
