import Link from 'next/link'
import { signInWithPassword, resendConfirmationEmail } from './actions'
import { SignInForm } from './sign-in-form'

type SignInFormState = Awaited<ReturnType<typeof signInWithPassword>>
type ResendState = Awaited<ReturnType<typeof resendConfirmationEmail>>

const initialState: SignInFormState = {
  success: false,
  values: { email: '' },
}

const initialResendState: ResendState = {
  success: false,
  values: { email: '' },
}

const signInAction = async (_: SignInFormState, formData: FormData) => {
  'use server'
  return signInWithPassword(formData)
}

const resendAction = async (_: ResendState, formData: FormData) => {
  'use server'
  return resendConfirmationEmail(formData)
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to Hire.io
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
              create a new agency account
            </Link>
          </p>
        </div>

        <SignInForm
          action={signInAction}
          resendAction={resendAction}
          initialState={initialState}
          initialResendState={initialResendState}
        />
      </div>
    </div>
  )
}
