'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function hasAuthTokens(hash: string) {
  if (!hash.startsWith('#')) return false
  const params = new URLSearchParams(hash.slice(1))
  return Boolean(params.get('access_token') && params.get('refresh_token'))
}

export function AuthHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (hasAuthTokens(window.location.hash)) {
      router.replace(`/auth/callback${window.location.hash}`)
    }
  }, [router])

  return null
}
