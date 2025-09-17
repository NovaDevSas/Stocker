import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  isAdmin: boolean | null
  signInWithPassword: (args: { email: string; password: string }) => Promise<{ error: string | null }>
  signUp: (args: { email: string; password: string; displayName: string; username: string; phone?: string }) => Promise<{ error: string | null; user: User | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
    }).finally(() => {
      if (mounted) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle()
        if (!error && data) setIsAdmin(Boolean(data.is_admin))
        else setIsAdmin(false)
      } else {
        setIsAdmin(null)
      }
    }
    loadProfile()
  }, [user?.id])

  const signInWithPassword: AuthContextType['signInWithPassword'] = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  const signUp: AuthContextType['signUp'] = async ({ email, password, displayName, username, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username: username,
          phone: phone || null
        }
      }
    })
    return { error: error ? error.message : null, user: data.user }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = { session, user, loading, isAdmin, signInWithPassword, signUp, signOut }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}