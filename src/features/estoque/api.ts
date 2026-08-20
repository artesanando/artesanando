import { supabase } from '../../lib/supabase'
import type {
  Devolucao,
  Emprestimo,
  EstoqueCategoria,
  EstoqueItem,
  EstoqueMovimento,
  MotivoMovimento,
} from '../../types/database'

export interface EmprestimoAtivo extends Emprestimo {
  devolucoes: Devolucao[]
  integrante: { nome: string } | null
  item: Pick<EstoqueItem, 'nome' | 'detalhe' | 'cor_hex' | 'categoria'> | null
}

export async function fetchEstoque(): Promise<EstoqueItem[]> {
  const { data, error } = await supabase.from('estoque_itens').select('*').order('nome')
  if (error) throw error
  return (data ?? []) as EstoqueItem[]
}

export async function fetchEmprestimosAtivos(): Promise<EmprestimoAtivo[]> {
  const { data, error } = await supabase
    .from('emprestimos')
    .select(
      '*, devolucoes(*), integrante:profiles!integrante_id(nome), item:estoque_itens!item_id(nome, detalhe, cor_hex, categoria)',
    )
    .is('encerrado_em', null)
    .order('data', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as EmprestimoAtivo[]
}

export async function criarItemEstoque(item: {
  categoria: EstoqueCategoria
  nome: string
  detalhe: string | null
  cor_hex: string | null
  quantidade: number
  capa_path?: string
}) {
  const { error } = await supabase.from('estoque_itens').insert(item)
  if (error) throw error
}

export async function atualizarItemEstoque(
  id: string,
  patch: Partial<Pick<EstoqueItem, 'nome' | 'detalhe' | 'cor_hex' | 'categoria' | 'capa_path'>>,
) {
  const { error } = await supabase.from('estoque_itens').update(patch).eq('id', id)
  if (error) throw error
}

/* A quantidade nunca é escrita direto: passa por um movimento, e o trigger no
   banco aplica o delta. É o que deixa auditar sumiço de novelo. */
export async function lancarMovimento(m: {
  item_id: string
  delta: number
  motivo: MotivoMovimento
  obs: string | null
  criado_por: string
}) {
  const { error } = await supabase.from('estoque_movimentos').insert(m)
  if (error) throw error
}

export async function fetchMovimentosDoItem(itemId: string): Promise<EstoqueMovimento[]> {
  const { data, error } = await supabase
    .from('estoque_movimentos')
    .select('*, autor:profiles!criado_por(nome)')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as EstoqueMovimento[]
}

export async function criarEmprestimo(e: {
  item_id: string
  integrante_id: string
  quantidade: number
  projeto_nome: string | null
}) {
  const { error } = await supabase.from('emprestimos').insert(e)
  if (error) throw error
}

/* ---------- Lógica derivada (unit-testada) ---------- */

/** Saldo ainda emprestado de um empréstimo (quantidade − devoluções parciais) */
export function saldoEmprestimo(e: Pick<EmprestimoAtivo, 'quantidade' | 'devolucoes'>): number {
  return e.quantidade - e.devolucoes.reduce((s, d) => s + d.quantidade, 0)
}

/** Total emprestado por item, somando os saldos dos empréstimos ativos */
export function emprestadoPorItem(loans: EmprestimoAtivo[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const e of loans) {
    if (e.encerrado_em) continue
    map.set(e.item_id, (map.get(e.item_id) ?? 0) + saldoEmprestimo(e))
  }
  return map
}

/** Disponível = total em posse − emprestado ativo */
export function disponivel(item: EstoqueItem, emprestado: number): number {
  return Math.max(0, item.quantidade - emprestado)
}
