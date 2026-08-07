import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'
import { saldoEmprestimo, type EmprestimoAtivo } from '../estoque/api'

export async function fetchIntegrantes(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return (data ?? []) as Profile[]
}

export interface EntregasLight {
  unidades: { responsavel_id: string | null; status: string }[]
  faixas: { responsavel_id: string | null; status: string }[]
}

export async function fetchEntregasLight(): Promise<EntregasLight> {
  const [un, fx] = await Promise.all([
    supabase.from('unidades').select('responsavel_id, status'),
    supabase.from('faixas').select('responsavel_id, status'),
  ])
  if (un.error || fx.error) throw un.error ?? fx.error
  return {
    unidades: (un.data ?? []) as EntregasLight['unidades'],
    faixas: (fx.data ?? []) as EntregasLight['faixas'],
  }
}

/* ---------- Derivados (unit-testados) ---------- */

export function entregasDe(integranteId: string, dados: EntregasLight) {
  const amigurumis = dados.unidades.filter(
    (u) => u.responsavel_id === integranteId && u.status === 'concluida',
  ).length
  const faixas = dados.faixas.filter(
    (f) => f.responsavel_id === integranteId && f.status === 'feita',
  ).length
  return { amigurumis, faixas, total: amigurumis + faixas }
}

/** Itens que a integrante ainda tem em casa (saldo dos empréstimos ativos) */
export function emprestadosDe(integranteId: string, loans: EmprestimoAtivo[]): number {
  return loans
    .filter((e) => e.integrante_id === integranteId && !e.encerrado_em)
    .reduce((s, e) => s + saldoEmprestimo(e), 0)
}

export function filtraIntegrantes(integrantes: Profile[], busca: string): Profile[] {
  const q = busca.trim().toLowerCase()
  if (!q) return integrantes
  return integrantes.filter(
    (p) => p.nome.toLowerCase().includes(q) || p.usuario.toLowerCase().includes(q),
  )
}
