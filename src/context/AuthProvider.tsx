import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'
import { cleanAuthUrl, initialAuthError, type AuthCallbackError } from '../lib/authCallback'
import { useToast } from './ToastProvider'

interface AuthState {
  ready: boolean
  session: Session | null
  profile: Profile | null
  authError: AuthCallbackError | null
  clearAuthError: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authError, setAuthError] = useState<AuthCallbackError | null>(initialAuthError)

  const userId = session?.user.id

  const loadProfile = useCallback(
    async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      if (error) toast.error(error, 'PROFIL NICHT GELADEN')
      setProfile(data ?? null)
    },
    [toast],
  )

  // Erst getSession() abwarten (verarbeitet den OAuth-Callback), dann Router rendern.
  useEffect(() => {
    let active = true
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error && !initialAuthError) toast.error(error, 'LOGIN FEHLGESCHLAGEN')
        setSession(data.session)
      })
      .finally(() => {
        if (!active) return
        cleanAuthUrl()
        setReady(true)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) setProfile(null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [toast])

  useEffect(() => {
    if (userId) void loadProfile(userId)
  }, [userId, loadProfile])

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) toast.error(error, 'LOGIN FEHLGESCHLAGEN')
  }, [toast])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) toast.error(error, 'LOGOUT FEHLGESCHLAGEN')
  }, [toast])

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId)
  }, [userId, loadProfile])

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      profile,
      authError,
      clearAuthError: () => setAuthError(null),
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [ready, session, profile, authError, signInWithGoogle, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider genutzt werden')
  return ctx
}
