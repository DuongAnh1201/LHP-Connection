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

function getInitialAuthMessage() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const errDesc = params.get('error_description')
  const err = params.get('error')
  if (!errDesc && !err) return null

  const raw = errDesc || err || 'Đăng nhập thất bại.'
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isConfigured)
  const [authMessage, setAuthMessage] = useState<string | null>(() => getInitialAuthMessage())

  useEffect(() => {
    if (!isConfigured) return

    if (authMessage) {
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
  }, [authMessage])

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
