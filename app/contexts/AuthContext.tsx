'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase/client'

export type AppRole = 'user' | 'vendor' | 'admin'

type AuthContextValue = {
  isLoading: boolean
  session: Session | null
  user: User | null
  role: AppRole | null
  refreshRole: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchCurrentRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('role,status')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data || data.status !== 'active') return null
  return data.role as AppRole
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)

  const refreshRole = async () => {
    if (!user?.id) {
      setRole(null)
      return
    }
    const nextRole = await fetchCurrentRole(user.id)
    setRole(nextRole)
  }

  useEffect(() => {
    let isMounted = true

    supabaseClient.auth.getSession().then(async ({ data }) => {
      if (!isMounted) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      if (data.session?.user?.id) {
        const nextRole = await fetchCurrentRole(data.session.user.id)
        if (isMounted) setRole(nextRole)
      } else {
        setRole(null)
      }
      if (isMounted) setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession ?? null)
      setUser(nextSession?.user ?? null)
      if (event === 'TOKEN_REFRESHED') {
        if (isMounted) setIsLoading(false)
        return
      }
      if (nextSession?.user?.id) {
        const nextRole = await fetchCurrentRole(nextSession.user.id)
        if (isMounted) setRole(nextRole)
      } else {
        setRole(null)
      }
      if (isMounted) setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    // Optimistic local sign-out for instant UX.
    setSession(null)
    setUser(null)
    setRole(null)

    try {
      const result = await Promise.race([
        supabaseClient.auth.signOut({ scope: 'local' }),
        new Promise<{ error: null }>((resolve) => setTimeout(() => resolve({ error: null }), 2000)),
      ])

      const error = result?.error
      if (error && error.status !== 403) {
        // Do not block UI logout for server-side token revocation issues.
        console.warn('Supabase signOut warning:', error.message)
      }
    } catch (error) {
      console.warn('Supabase signOut failed:', error)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ isLoading, session, user, role, refreshRole, signOut }),
    [isLoading, role, session, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
