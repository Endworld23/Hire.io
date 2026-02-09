import 'server-only'

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
} as const

const missing = Object.entries(env)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missing.length > 0) {
  throw new Error(`Missing server env vars: ${missing.join(', ')}`)
}
