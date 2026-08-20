import { supabase } from '../../lib/supabase'
import { turnoDaPessoa, type Profile } from '../../types/database'
import { saldoEmprestimo, type EmprestimoAtivo } from '../estoque/api'

export async function fetchIntegrantes(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return normalizaPerfis(data)
}

/** Toda linha de perfil entra no app com um turno válido — ver `turnoDaPessoa` */
function normalizaPerfis(data: unknown): Profile[] {
  return ((data ?? []) as Profile[]).map((p) => ({ ...p, turno: turnoDaPessoa(p.turno) }))
}

export interface EntregasLight {
  unidades: { responsavel_id: string | null; status: string }[]
  faixas: { responsavel_id: string | null; status: string }[]
  squares: { responsavel_id: string | null; etapa: string }[]
}

export async function fetchEntregasLight(): Promise<EntregasLight> {
  const [un, fx, sq] = await Promise.all([
    supabase.from('unidades').select('responsavel_id, status'),
    supabase.from('faixas').select('responsavel_id, status'),
    supabase.from('squares').select('responsavel_id, etapa'),
  ])
  if (un.error || fx.error || sq.error) throw un.error ?? fx.error ?? sq.error
  return {
    unidades: (un.data ?? []) as EntregasLight['unidades'],
    faixas: (fx.data ?? []) as EntregasLight['faixas'],
    squares: (sq.data ?? []) as EntregasLight['squares'],
  }
}

/** Integrantes anotadas na chamada que ainda não têm conta no app */
export async function fetchSemConta(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .is('user_id', null)
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return normalizaPerfis(data)
}

/** Junta a ficha de "só chamada" numa integrante que já tem conta */
export async function vincularPerfil(origem: string, destino: string) {
  const { error } = await supabase.rpc('vincular_perfil', {
    p_origem: origem,
    p_destino: destino,
  })
  if (error) throw error
}

export async function definirAtivo(id: string, ativo: boolean) {
  const { error } = await supabase.from('profiles').update({ ativo }).eq('id', id)
  if (error) throw error
}

/* ---------- Derivados (unit-testados) ---------- */

/* Granny squares entram na conta desde que o square passou a guardar quem o fez
   — antes disso, quem só fazia manta de crochê aparecia com zero entregas. */
export function entregasDe(integranteId: string, dados: EntregasLight) {
  const amigurumis = dados.unidades.filter(
    (u) => u.responsavel_id === integranteId && u.status === 'concluida',
  ).length
  const faixas = dados.faixas.filter(
    (f) => f.responsavel_id === integranteId && f.status === 'feita',
  ).length
  const grannies = dados.squares.filter(
    (s) => s.responsavel_id === integranteId && s.etapa === 'pronto',
  ).length
  return { amigurumis, faixas, grannies, total: amigurumis + faixas + grannies }
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
