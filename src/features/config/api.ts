import { supabase } from '../../lib/supabase'
import type { Permissoes, Profile } from '../../types/database'

export type PermCol = 'progresso' | 'devolucoes' | 'comentarios' | 'financeiro'

export interface PermissaoRow
  extends Pick<Profile, 'id' | 'nome' | 'avatar_color' | 'avatar_url' | 'email' | 'user_id'> {
  permissoes: Permissoes | null
}

export async function fetchPermissoes(): Promise<PermissaoRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, avatar_color, avatar_url, email, user_id, permissoes(*)')
    .eq('papel', 'integrante')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return (data ?? []) as unknown as PermissaoRow[]
}

export async function togglePermissao(id: string, col: PermCol, value: boolean) {
  const { error } = await supabase
    .from('permissoes')
    .update({ [col]: value })
    .eq('profile_id', id)
  if (error) throw error
}
