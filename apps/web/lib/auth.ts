import { supabase } from './supabase'
import type { SignUpInput, SignInInput } from '@hire-io/schemas'

export async function signUp(_data: SignUpInput) {
  return { data: null, error: new Error('Not implemented') }
}

export async function signIn(data: SignInInput) {
  return await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getUser() {
  return await supabase.auth.getUser()
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    (async () => {
      callback(event, session)
    })()
  })
}
