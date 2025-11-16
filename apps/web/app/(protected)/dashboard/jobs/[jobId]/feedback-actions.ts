'use server'

import { addApplicationFeedback } from '@/lib/actions/applications'

export async function addFeedbackAction(formData: FormData) {
  await addApplicationFeedback(formData)
}
