import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { setKeepConnected, supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  login: (usuarioOuEmail: string, senha: string, manter: boolean) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (senha: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data as Profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let alive = true
    fetchProfile(userId).then((p) => {
      if (alive) {
        setProfile(p)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [userId])

  const login = async (usuarioOuEmail: string, senha: string, manter: boolean) => {
    setKeepConnected(manter)
    let email = usuarioOuEmail.trim()
    if (!email.includes('@')) {
      const { data, error } = await supabase.rpc('email_por_usuario', {
        usuario_input: email,
      })
      if (error || !data) throw new Error('Usuário ou senha incorretos')
      email = data as string
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error('Usuário ou senha incorretos')
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) throw new Error('Não foi possível enviar o email. Tente novamente.')
  }

  const updatePassword = async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw new Error(error.message)
  }

  const refreshProfile = async () => {
    if (userId) setProfile(await fetchProfile(userId))
  }

  return (
    <Ctx.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin: profile?.papel === 'admin',
        login,
        logout,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
