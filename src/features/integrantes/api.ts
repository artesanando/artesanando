import { supabase } from '../../lib/supabase'
import {
  nivelDaPessoa,
  turnoDaPessoa,
  type Nivel,
  type Papel,
  type Profile,
} from '../../types/database'
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

/** O square guarda as duas metades separadas — ver `MEIO_SQUARE` */
export type PecaSquare = Peca & { etapa: string; miolo_por: string | null; borda_por: string | null }

/* Peça de feira: a única entrega que não sai de projeto. Não tem de quem herdar
   semestre, então carrega o seu. `quantidade` é o que sobrou e `vendidos` o que
   saiu — quem fez, fez as duas. */
export interface PecaFeira {
  autoria_id: string | null
  quantidade: number
  vendidos: number
  semestre_id: string | null
  arquivado_em: string | null
}

export interface EntregasLight {
  unidades: (Peca & { status: string })[]
  faixas: (Peca & { status: string })[]
  squares: PecaSquare[]
  feira: PecaFeira[]
}

export async function fetchEntregasLight(): Promise<EntregasLight> {
  const projeto = 'projetos!inner(semestre_id)'
  const [un, fx, sq, fe] = await Promise.all([
    supabase.from('unidades').select(`responsavel_id, status, ${projeto}`),
    supabase.from('faixas').select(`responsavel_id, status, ${projeto}`),
    supabase.from('squares').select(`responsavel_id, etapa, miolo_por, borda_por, ${projeto}`),
    supabase
      .from('estoque_itens')
      .select('autoria_id, quantidade, vendidos, semestre_id, arquivado_em')
      .eq('categoria', 'feira')
      .not('autoria_id', 'is', null),
  ])
  if (un.error || fx.error || sq.error || fe.error) {
    throw un.error ?? fx.error ?? sq.error ?? fe.error
  }
  return {
    unidades: (un.data ?? []) as unknown as EntregasLight['unidades'],
    faixas: (fx.data ?? []) as unknown as EntregasLight['faixas'],
    squares: (sq.data ?? []) as unknown as EntregasLight['squares'],
    feira: (fe.data ?? []) as unknown as EntregasLight['feira'],
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
  feira: number
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
  const grannies = grannyDe(integranteId, dados.squares, semestreId)
  const feira = feiraDe(integranteId, dados.feira ?? [], semestreId)
  return { amigurumis, faixas, grannies, feira, total: amigurumis + faixas + grannies + feira }
}

/* Uma entrega por peça feita, vendida ou não: quem fez cinco chaveiros fez
   cinco, e `quantidade` só mostra o que ainda está na caixa. Item arquivado sai
   da conta — arquivar é o jeito de dizer que aquilo não conta mais. */
export function feiraDe(
  integranteId: string,
  itens: PecaFeira[],
  semestreId: string | null = null,
): number {
  return itens
    .filter(
      (i) =>
        i.autoria_id === integranteId &&
        !i.arquivado_em &&
        (!semestreId || i.semestre_id === semestreId),
    )
    .reduce((s, i) => s + i.quantidade + i.vendidos, 0)
}

/** Miolo e borda valem metade cada; square inteiro, um */
export const MEIO_SQUARE = 0.5

/* Um square é quase sempre feito por duas pessoas: uma faz o miolo, outra a
   borda. Contar só quem terminou dava a entrega inteira para a segunda e nada
   para a primeira. Quem fez as duas metades leva o square inteiro. */
export function grannyDe(
  integranteId: string,
  squares: PecaSquare[],
  semestreId: string | null = null,
): number {
  let total = 0
  for (const s of squares) {
    if (semestreId && s.projetos?.semestre_id !== semestreId) continue
    if (s.miolo_por === integranteId) total += MEIO_SQUARE
    if (s.borda_por === integranteId) total += MEIO_SQUARE
  }
  return total
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

/* Tornar administradora, ou devolver alguém a integrante. O banco já autorizava — `guard_profile_update`
   só barra não-admin —, mas não havia caminho na interface: dava para nascer
   admin no cadastro e nunca mais mudar. O gatilho de auditoria registra a troca. */
export async function definirPapel(id: string, papel: Papel) {
  const { error } = await supabase.from('profiles').update({ papel }).eq('id', id)
  if (error) throw error
}
