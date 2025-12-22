import { redirect } from 'next/navigation'

type JobDetailRedirectProps = {
  params: { jobId: string }
}

export default function JobDetailRedirect({ params }: JobDetailRedirectProps) {
  return redirect(`/dashboard/jobs/${params.jobId}/edit`)
}
