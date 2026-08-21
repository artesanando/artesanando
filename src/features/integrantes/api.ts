import { supabase } from '../../lib/supabase'
import { nivelDaPessoa, turnoDaPessoa, type Nivel, type Profile } from '../../types/database'
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

/** Toda linha de perfil entra no app com turno e nível válidos */
function normalizaPerfis(data: unknown): Profile[] {
  return ((data ?? []) as Profile[]).map((p) => ({
    ...p,
    turno: turnoDaPessoa(p.turno),
    nivel: nivelDaPessoa(p.nivel),
  }))
}

/* A peça não guarda data de conclusão; quem tem semestre é o projeto. Então a
   entrega conta no semestre em que o projeto foi criado, e por isso cada linha
   traz o `semestre_id` dele junto. */
interface Peca {
  responsavel_id: string | null
  projetos: { semestre_id: string | null } | null
}

export interface EntregasLight {
  unidades: (Peca & { status: string })[]
  faixas: (Peca & { status: string })[]
  squares: (Peca & { etapa: string })[]
}

export async function fetchEntregasLight(): Promise<EntregasLight> {
  const projeto = 'projetos!inner(semestre_id)'
  const [un, fx, sq] = await Promise.all([
    supabase.from('unidades').select(`responsavel_id, status, ${projeto}`),
    supabase.from('faixas').select(`responsavel_id, status, ${projeto}`),
    supabase.from('squares').select(`responsavel_id, etapa, ${projeto}`),
  ])
  if (un.error || fx.error || sq.error) throw un.error ?? fx.error ?? sq.error
  return {
    unidades: (un.data ?? []) as unknown as EntregasLight['unidades'],
    faixas: (fx.data ?? []) as unknown as EntregasLight['faixas'],
    squares: (sq.data ?? []) as unknown as EntregasLight['squares'],
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

/* Administradora corrige o nível de quem se classificou errado. A troca fica
   registrada na auditoria pelo gatilho do banco, com quem fez e quando — é ela
   que decide de qual regra do semestre a pessoa é cobrada. */
export async function definirNivel(id: string, nivel: Nivel) {
  const { error } = await supabase.from('profiles').update({ nivel }).eq('id', id)
  if (error) throw error
}

/* A policy de `perfis_academico` só devolve o que a chamadora pode ver: para
   administradora vem tudo, para as demais vem só a própria linha. Não há
   `if (isAdmin)` aqui porque a decisão é do banco, não da tela. */
export async function fetchRas(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('perfis_academico').select('profile_id, ra')
  if (error) throw error
  const linhas = (data ?? []) as { profile_id: string; ra: string | null }[]
  return new Map(linhas.filter((l) => l.ra).map((l) => [l.profile_id, l.ra!]))
}

/* ---------- Derivados (unit-testados) ---------- */

export interface Entregas {
  amigurumis: number
  faixas: number
  grannies: number
  total: number
}

/* Granny squares entram na conta desde que o square passou a guardar quem o fez
   — antes disso, quem só fazia manta de crochê aparecia com zero entregas.
   `semestreId` nulo conta tudo; com semestre, conta só as peças de projetos
   daquele semestre, que é o recorte que o relatório de extensão pede. */
export function entregasDe(
  integranteId: string,
  dados: EntregasLight,
  semestreId: string | null = null,
): Entregas {
  const dela = (p: Peca) =>
    p.responsavel_id === integranteId &&
    (!semestreId || p.projetos?.semestre_id === semestreId)

  const amigurumis = dados.unidades.filter((u) => dela(u) && u.status === 'concluida').length
  const faixas = dados.faixas.filter((f) => dela(f) && f.status === 'feita').length
  const grannies = dados.squares.filter((s) => dela(s) && s.etapa === 'pronto').length
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
