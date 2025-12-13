'use client'

import { useFormState, useFormStatus } from 'react-dom'

type SignUpFormState = {
  success: boolean
  fieldErrors?: Record<string, string>
  formError?: string
  values?: {
    fullName?: string
    companyName?: string
    email?: string
  }
}

type SignUpFormProps = {
  action: (state: SignUpFormState, formData: FormData) => Promise<SignUpFormState>
  initialState: SignUpFormState
}

export function SignUpForm({ action, initialState }: SignUpFormProps) {
  const [state, formAction] = useFormState(action, initialState)

  return (
    <form className="mt-8 space-y-6" action={formAction}>
      {state?.formError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{state.formError}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="John Doe"
            aria-invalid={Boolean(state?.fieldErrors?.fullName)}
            defaultValue={state?.values?.fullName ?? ''}
          />
          {state?.fieldErrors?.fullName && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="you@agency.com"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            defaultValue={state?.values?.email ?? ''}
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Agency Name
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Acme Staffing"
            aria-invalid={Boolean(state?.fieldErrors?.companyName)}
            defaultValue={state?.values?.companyName ?? ''}
          />
          {state?.fieldErrors?.companyName && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.companyName}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="••••••••"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.password}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>
      </div>

      <SubmitButton />

      <p className="mt-2 text-center text-xs text-gray-500">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account...' : 'Create agency account'}
    </button>
  )
}
