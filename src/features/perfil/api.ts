import { supabase } from '../../lib/supabase'
import type { Preferencia, Turno } from '../../types/database'

export async function atualizarPerfil(
  id: string,
  dados: {
    nome?: string
    usuario?: string
    telefone?: string | null
    preferencia?: Preferencia
    turno?: Turno
    avatar_color?: string
    avatar_url?: string | null
  },
) {
  const { error } = await supabase.from('profiles').update(dados).eq('id', id)
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
