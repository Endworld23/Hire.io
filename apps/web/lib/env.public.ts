export const envPublic = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
} as const

const missingPublic = Object.entries(envPublic)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingPublic.length > 0) {
  throw new Error(`Missing public env vars: ${missingPublic.join(', ')}`)
}
