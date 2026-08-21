import { supabase } from '../../lib/supabase'
import type { EstoqueItem } from '../../types/database'
import { emprestadoPorItem, type EmprestimoAtivo } from '../estoque/api'
import type { Atividade, Projeto } from '../projetos/api'

export interface AtividadeGlobal extends Omit<Atividade, 'autor'> {
  autor?: { nome: string; avatar_color: string } | null
  projeto?: { nome: string } | null
}

export async function fetchAtividadesRecentes(): Promise<AtividadeGlobal[]> {
  const { data, error } = await supabase
    .from('atividades')
    .select('*, autor:profiles!autor_id(nome, avatar_color), projeto:projetos!projeto_id(nome)')
    .order('created_at', { ascending: false })
    .limit(4)
  if (error) throw error
  return (data ?? []) as unknown as AtividadeGlobal[]
}

export async function fetchTotalIntegrantes(): Promise<number> {
  const { data, error } = await supabase.from('profiles').select('id').eq('ativo', true)
  if (error) throw error
  return (data ?? []).length
}

/* ---------- KPIs derivados (unit-testados) ---------- */

export function novelosKpis(itens: EstoqueItem[], loans: EmprestimoAtivo[]) {
  const emprestados = emprestadoPorItem(loans)
  const novelos = itens.filter((i) => i.categoria === 'novelos')
  const emprestado = novelos.reduce((s, i) => s + (emprestados.get(i.id) ?? 0), 0)
  const total = novelos.reduce((s, i) => s + i.quantidade, 0)
  return { emEstoque: total - emprestado, emprestados: emprestado }
}

export function projetosAtivos(projetos: Pick<Projeto, 'tipo' | 'status'>[]) {
  const ativos = projetos.filter((p) => p.status === 'ativo')
  return {
    mantas: ativos.filter((p) => p.tipo !== 'amigurumi').length,
    amigurumis: ativos.filter((p) => p.tipo === 'amigurumi').length,
  }
}

/* Saudação pela hora local. A noite atravessa a virada do dia: quem abre o app
   às duas da manhã ainda está na noite anterior, não no dia seguinte. */
export function saudacao(hora: number): string {
  if (hora < 4) return 'Boa noite'
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Primeiro nome para a saudação */
export function primeiroNome(nome: string): string {
  return nome.split(' ')[0]
}
