import Link from 'next/link'
import { signUpWithTenant } from './actions'
import { SignUpForm } from './sign-up-form'

type SignUpFormState = Awaited<ReturnType<typeof signUpWithTenant>>

const initialState: SignUpFormState = { success: false }

const signUpAction = async (_: SignUpFormState, formData: FormData) => {
  'use server'
  return signUpWithTenant(formData)
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your agency account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <SignUpForm action={signUpAction} initialState={initialState} />
      </div>
    </div>
  )
}
