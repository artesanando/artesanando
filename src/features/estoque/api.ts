import { supabase } from '../../lib/supabase'
import type { Devolucao, Emprestimo, EstoqueItem } from '../../types/database'

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

export function estoqueBaixo(item: EstoqueItem, emprestado: number): boolean {
  return disponivel(item, emprestado) <= item.minimo
}
