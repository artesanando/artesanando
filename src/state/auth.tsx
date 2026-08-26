import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { setKeepConnected, supabase } from '../lib/supabase'
import { nivelDaPessoa, turnoDaPessoa, type Permissoes, type Profile } from '../types/database'

export type Perm = 'progresso' | 'devolucoes' | 'financeiro' | 'presenca'

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  /** permissão efetiva: admin sempre pode; integrante depende da flag */
  can: (perm: Perm) => boolean
  login: (usuario: string, senha: string, manter: boolean) => Promise<void>
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
  const [sessaoLida, setSessaoLida] = useState(false)
  const qc = useQueryClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessaoLida(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setSessaoLida(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  /* O perfil ficava congelado no que foi lido no login: quando a coordenação
     corrigia o nível de alguém, a própria dona seguia vendo o antigo — e a meta
     dela era medida pela regra errada até sair e entrar de novo. Passando pelo
     react-query ele revalida como todo o resto, e `refreshProfile` é só uma
     invalidação a mais. */
  const { data: perfil, isPending: carregandoPerfil } = useQuery({
    queryKey: ['meu-perfil', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  })
  const profile = userId ? (perfil ?? null) : null

  const { data: permissoes } = useQuery({
    queryKey: ['minhas-permissoes', profile?.id],
    queryFn: () => fetchPermissoes(profile!.id),
    enabled: Boolean(profile?.id),
  })
  const perms = profile ? (permissoes ?? null) : null

  const loading = !sessaoLida || (Boolean(userId) && carregandoPerfil)

  /* Entra-se pelo nome de usuário. O Auth exige um email para achar a conta,
     mas ele é só o identificador interno dela — o banco devolve qual é, e nem
     a tela nem quem entra precisa saber que existe. */
  const login = async (usuario: string, senha: string, manter: boolean) => {
    setKeepConnected(manter)
    const { data, error: erroLookup } = await supabase.rpc('login_por_usuario', {
      usuario_input: usuario.trim(),
    })
    if (erroLookup || !data) throw new Error('Usuário ou senha incorretos')
    const { error } = await supabase.auth.signInWithPassword({
      email: data as string,
      password: senha,
    })
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
    await qc.invalidateQueries({ queryKey: ['meu-perfil', userId] })
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
