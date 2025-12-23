'use client'

import { useTransition, useState } from 'react'
import { ensureProfile } from './actions'

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleFix = () => {
    setError(null)
    startTransition(async () => {
      const result = await ensureProfile()
      if (result && !('then' in result) && result.success === false) {
        setError(result.error || 'Unable to repair profile')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Complete your profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            We could not find your workspace profile. Click below to repair it and continue.
          </p>
        </div>
        {error && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleFix}
          disabled={isPending}
          className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Repairing...' : 'Fix and continue'}
        </button>
      </div>
    </div>
  )
}
