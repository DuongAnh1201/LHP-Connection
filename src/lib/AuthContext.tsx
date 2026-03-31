import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isConfigured } from './supabase'
import { getOAuthRedirectTo } from './authRedirect'

interface AuthState {
  user: User | null
  loading: boolean
  authMessage: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearAuthMessage: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  authMessage: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  clearAuthMessage: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const errDesc = params.get('error_description')
    const err = params.get('error')
    if (errDesc || err) {
      const raw = errDesc || err || 'Đăng nhập thất bại.'
      try {
        setAuthMessage(decodeURIComponent(raw.replace(/\+/g, ' ')))
      } catch {
        setAuthMessage(raw)
      }
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setAuthMessage(null)
    const redirectTo = getOAuthRedirectTo()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) setAuthMessage(error.message)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const clearAuthMessage = useCallback(() => setAuthMessage(null), [])

  return (
    <AuthContext.Provider value={{ user, loading, authMessage, signInWithGoogle, signOut, clearAuthMessage }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
