import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { setKeepConnected, supabase } from '../lib/supabase'
import { nivelDaPessoa, turnoDaPessoa, type Permissoes, type Profile } from '../types/database'

export type Perm = 'progresso' | 'devolucoes' | 'comentarios' | 'financeiro' | 'presenca'

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  /** permissão efetiva: admin sempre pode; integrante depende da flag */
  can: (perm: Perm) => boolean
  login: (usuarioOuEmail: string, senha: string, manter: boolean) => Promise<void>
  logout: () => Promise<void>
  updatePassword: (senha: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

/* O id do perfil não é mais o id da conta: uma integrante pode existir só para a
   chamada (sem conta) e ganhar acesso depois, mantendo o mesmo perfil. Por isso a
   busca é por `user_id`, e as permissões dependem do perfil encontrado. */
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  const perfil = (data as Profile | null) ?? null
  // o perfil circula pelo app inteiro: entra sempre com turno e nível válidos
  return (
    perfil && {
      ...perfil,
      turno: turnoDaPessoa(perfil.turno),
      nivel: nivelDaPessoa(perfil.nivel),
    }
  )
}

async function fetchPermissoes(profileId: string): Promise<Permissoes | null> {
  const { data } = await supabase
    .from('permissoes')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()
  return (data as Permissoes | null) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [perms, setPerms] = useState<Permissoes | null>(null)
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
      setPerms(null)
      return
    }
    let alive = true
    fetchProfile(userId)
      .then(async (p) => (alive ? ([p, p ? await fetchPermissoes(p.id) : null] as const) : null))
      .then((res) => {
        if (!alive || !res) return
        setProfile(res[0])
        setPerms(res[1])
        setLoading(false)
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

  const updatePassword = async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw new Error(error.message)
  }

  const refreshProfile = async () => {
    if (userId) setProfile(await fetchProfile(userId))
  }

  const isAdmin = profile?.papel === 'admin'

  return (
    <Ctx.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin,
        can: (perm) => isAdmin || Boolean(perms?.[perm]),
        login,
        logout,
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
