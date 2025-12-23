'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { signInWithPassword, resendConfirmationEmail } from './actions'

type SignInFormState = Awaited<ReturnType<typeof signInWithPassword>>
type ResendState = Awaited<ReturnType<typeof resendConfirmationEmail>>

type SignInFormProps = {
  action: (state: SignInFormState, formData: FormData) => Promise<SignInFormState>
  resendAction: (state: ResendState, formData: FormData) => Promise<ResendState>
  initialState: SignInFormState
  initialResendState: ResendState
}

export function SignInForm({
  action,
  resendAction,
  initialState,
  initialResendState,
}: SignInFormProps) {
  const [state, formAction] = useFormState(action, initialState)
  const [resendState, resendFormAction] = useFormState(resendAction, initialResendState)
  const router = useRouter()
  const signedIn = Boolean(state?.success)

  useEffect(() => {
    if (signedIn) {
      router.push('/dashboard')
      router.refresh()
    }
  }, [router, signedIn])

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

      {signedIn && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Signed in — redirecting...
        </div>
      )}

      {state?.needsEmailConfirmation && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Email not confirmed. Please check your inbox.
              </h3>
              {resendState?.resendSent && (
                <p className="mt-1 text-sm text-green-700">Confirmation email sent.</p>
              )}
              {resendState?.formError && (
                <p className="mt-1 text-sm text-red-700">{resendState.formError}</p>
              )}
            </div>
            <form action={resendFormAction} className="flex items-center gap-2">
              <input type="hidden" name="email" value={state?.values?.email ?? ''} />
              <ResendButton />
            </form>
          </div>
        </div>
      )}

      <div className="rounded-md shadow-sm space-y-4">
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
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="you@agency.com"
            aria-invalid={Boolean(state?.formError)}
            defaultValue={state?.values?.email ?? ''}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            aria-invalid={Boolean(state?.formError)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </Link>
        </div>
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const disabled = pending
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

function ResendButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
    >
      {pending ? 'Sending...' : 'Resend email'}
    </button>
  )
}
