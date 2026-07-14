import { supabase } from '../../lib/supabase'
import type { Preferencia } from '../../types/database'

export async function atualizarPerfil(
  id: string,
  dados: { nome: string; telefone: string | null; preferencia: Preferencia },
) {
  const { error } = await supabase.from('profiles').update(dados).eq('id', id)
  if (error) throw error
}
