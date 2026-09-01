import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getDataClient } from '@/lib/data'
import type { DataClient } from '@/lib/data/client'
import type { Profile, Session } from '@/types'

interface AuthContextValue {
  client: DataClient
  session: Session | null
  user: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getDataClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    client
      .getSession()
      .then((value) => {
        if (active) setSession(value)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const unsubscribe = client.onAuthChange((value) => setSession(value))
    return () => {
      active = false
      unsubscribe()
    }
  }, [client])

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session,
      user: session?.user ?? null,
      loading,
      signUp: async (email, password, fullName) => {
        const next = await client.signUp(email, password, fullName)
        setSession(next)
      },
      signIn: async (email, password) => {
        const next = await client.signIn(email, password)
        setSession(next)
      },
      signOut: async () => {
        await client.signOut()
        setSession(null)
      },
      refresh: async () => {
        const next = await client.getSession()
        setSession(next)
      },
    }),
    [client, loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
