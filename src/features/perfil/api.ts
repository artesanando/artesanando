import { supabase } from '../../lib/supabase'
import type { Nivel, Preferencia, Turno } from '../../types/database'

export async function atualizarPerfil(
  id: string,
  dados: {
    nome?: string
    usuario?: string
    telefone?: string | null
    preferencia?: Preferencia
    turno?: Turno
    nivel?: Nivel
    avatar_color?: string
    avatar_url?: string | null
  },
) {
  const { error } = await supabase.from('profiles').update(dados).eq('id', id)
  if (error) throw error
}

/** Baixa a marca da senha provisória: a integrante já escolheu a dela. */
export async function senhaEscolhida(perfilId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ senha_provisoria: false })
    .eq('id', perfilId)
  if (error) throw error
}

/* O RA mora em `perfis_academico`, não em `profiles`: a policy de lá só devolve
   a linha para a própria dona ou para administradora, e o PostgREST não sabe
   esconder coluna. Assim nenhum `select('*')` de outra tela vaza RA de ninguém. */
export async function fetchMeuRa(perfilId: string): Promise<string> {
  const { data, error } = await supabase
    .from('perfis_academico')
    .select('ra')
    .eq('profile_id', perfilId)
    .maybeSingle()
  if (error) throw error
  return (data as { ra: string | null } | null)?.ra ?? ''
}

export async function salvarRa(perfilId: string, ra: string) {
  const { error } = await supabase
    .from('perfis_academico')
    .upsert({ profile_id: perfilId, ra: ra.trim() || null })
  if (error) throw error
}

/* A foto vai para o bucket `avatares` numa pasta com o id do perfil — é isso que
   a policy usa para deixar cada uma mexer só na própria. */
export async function subirAvatar(perfilId: string, arquivo: Blob): Promise<string> {
  const caminho = `${perfilId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('avatares')
    .upload(caminho, arquivo, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return caminho
}

export async function urlDoAvatar(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from('avatares').createSignedUrl(caminho, 60 * 60 * 8)
  return data?.signedUrl ?? null
}

export async function apagarAvatar(caminho: string) {
  await supabase.storage.from('avatares').remove([caminho])
}
