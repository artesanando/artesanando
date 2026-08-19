import { supabase } from './supabase'
import type { Arquivavel } from '../types/database'

/* Arquivar em vez de apagar: registro com histórico pendurado (presenças,
   produção, comentários, empréstimos) sai das listas mas continua no banco.
   Só o que não tem nada preso pode ser excluído de verdade — quem decide é a
   função `pode_excluir` no banco, para o app e o banco nunca discordarem. */

export async function podeExcluir(tabela: Arquivavel, id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('pode_excluir', { tabela, alvo: id })
  if (error) return false
  return Boolean(data)
}

export async function arquivar(tabela: Arquivavel, id: string) {
  const { error } = await supabase
    .from(tabela)
    .update({ arquivado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function desarquivar(tabela: Arquivavel, id: string) {
  const { error } = await supabase.from(tabela).update({ arquivado_em: null }).eq('id', id)
  if (error) throw error
}

export async function excluir(tabela: Arquivavel, id: string) {
  const { error } = await supabase.from(tabela).delete().eq('id', id)
  if (error) throw error
}

/** Separa uma lista entre ativos e arquivados */
export function separaArquivados<T extends { arquivado_em: string | null }>(itens: T[]) {
  return {
    ativos: itens.filter((i) => !i.arquivado_em),
    arquivados: itens.filter((i) => i.arquivado_em),
  }
}
