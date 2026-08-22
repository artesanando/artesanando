import { supabase } from '../../lib/supabase'
import { NIVEL_LABEL, type Nivel } from '../../types/database'
import { TIPO_LABEL, type BlocoRegra, type TipoLinha } from './creditos'

/* ---------- Regras ---------- */

interface BlocoRow {
  id: string
  nivel: Nivel
  ordem: number
  credito_linhas: { id: string; tipo: TipoLinha; quantidade: number }[]
}

/** Regras do semestre, já agrupadas por nível */
export async function fetchRegras(semestreId: string): Promise<Record<Nivel, BlocoRegra[]>> {
  const { data, error } = await supabase
    .from('credito_blocos')
    .select('id, nivel, ordem, credito_linhas(id, tipo, quantidade)')
    .eq('semestre_id', semestreId)
    .order('ordem')
  if (error) throw error

  const vazio: Record<Nivel, BlocoRegra[]> = { iniciante: [], experiente: [] }
  for (const b of (data ?? []) as unknown as BlocoRow[]) {
    vazio[b.nivel].push({ id: b.id, ordem: b.ordem, linhas: b.credito_linhas ?? [] })
  }
  return vazio
}

/** Devolve o id da exigência criada — copiar um semestre precisa dele */
export async function criarBloco(
  semestreId: string,
  nivel: Nivel,
  ordem: number,
): Promise<string> {
  const { data, error } = await supabase
    .from('credito_blocos')
    .insert({ semestre_id: semestreId, nivel, ordem })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function removerBloco(id: string) {
  const { error } = await supabase.from('credito_blocos').delete().eq('id', id)
  if (error) throw error
}

export async function criarLinha(blocoId: string, tipo: TipoLinha, quantidade: number) {
  const { error } = await supabase
    .from('credito_linhas')
    .insert({ bloco_id: blocoId, tipo, quantidade })
  if (error) throw error
}

export async function removerLinha(id: string) {
  const { error } = await supabase.from('credito_linhas').delete().eq('id', id)
  if (error) throw error
}

/* Virada de semestre: a regra costuma ser a mesma do semestre passado, e
   remontá-la clique a clique era o caminho obrigatório. Copia exigência por
   exigência para o semestre novo, mantendo a ordem. */
export async function copiarRegras(deSemestreId: string, paraSemestreId: string, nivel: Nivel) {
  const origem = await fetchRegras(deSemestreId)
  for (const bloco of origem[nivel]) {
    const novoId = await criarBloco(paraSemestreId, nivel, bloco.ordem)
    for (const linha of bloco.linhas) {
      await criarLinha(novoId, linha.tipo, linha.quantidade)
    }
  }
}

/* ---------- Marcas ---------- */

export interface CreditoMarca {
  semestre_id: string
  perfil_id: string
  mentoria: boolean
  cumprido: boolean
  motivo: string | null
  marcado_por: string | null
  marcado_em: string
}

/* A policy devolve todas as linhas para administradora e só a própria para as
   demais — a tela não precisa filtrar nada. */
export async function fetchMarcas(semestreId: string): Promise<Map<string, CreditoMarca>> {
  const { data, error } = await supabase
    .from('credito_marcas')
    .select('*')
    .eq('semestre_id', semestreId)
  if (error) throw error
  return new Map(((data ?? []) as CreditoMarca[]).map((m) => [m.perfil_id, m]))
}

export async function marcarCredito(m: {
  semestreId: string
  perfilId: string
  mentoria: boolean
  cumprido: boolean
  motivo: string | null
  por: string
}) {
  const { error } = await supabase.from('credito_marcas').upsert({
    semestre_id: m.semestreId,
    perfil_id: m.perfilId,
    mentoria: m.mentoria,
    cumprido: m.cumprido,
    motivo: m.motivo,
    marcado_por: m.por,
    marcado_em: new Date().toISOString(),
  })
  if (error) throw error
}

/* ---------- Auditoria ---------- */

export type AcaoAuditoria = 'nivel' | 'presenca' | 'entrega' | 'permissao' | 'credito'

export const ACAO_LABEL: Record<AcaoAuditoria, string> = {
  nivel: 'Nível',
  presenca: 'Presença',
  entrega: 'Entrega',
  permissao: 'Permissão',
  credito: 'Crédito',
}

export interface LinhaAuditoria {
  id: string
  autor_id: string | null
  alvo_id: string | null
  acao: AcaoAuditoria
  detalhe: Record<string, unknown>
  created_at: string
  autor?: { nome: string } | null
  alvo?: { nome: string } | null
}

/* A seção fica debaixo do seletor de semestre da página e ignorava-o: trocar o
   semestre não mudava uma linha. `auditoria` não tem `semestre_id` — o recorte é
   pelas datas do semestre, que é o que a pessoa espera ao trocar. */
export async function fetchAuditoria(
  periodo?: { inicio: string | null; fim: string | null },
  limite = 300,
): Promise<LinhaAuditoria[]> {
  let q = supabase
    .from('auditoria')
    .select('*, autor:profiles!autor_id(nome), alvo:profiles!alvo_id(nome)')
    .order('created_at', { ascending: false })
    .limit(limite)
  if (periodo?.inicio) q = q.gte('created_at', periodo.inicio)
  // o fim é um dia, e `created_at` é um instante: soma um dia para incluí-lo
  if (periodo?.fim) q = q.lt('created_at', diaSeguinte(periodo.fim))
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as unknown as LinhaAuditoria[]
}

/** '2026-12-15' → '2026-12-16' */
export function diaSeguinte(dia: string): string {
  const d = new Date(`${dia}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/* ---------- Derivados (unit-testados) ---------- */

/* O `detalhe` guarda o que o gatilho viu no banco: nome de coluna e valor de
   enum. Jogado direto na tela virava "ganhou presenca" (sem acento) e "mudou de
   experiente para iniciante". */
const PERM_LABEL: Record<string, string> = {
  progresso: 'registrar progresso',
  devolucoes: 'registrar devoluções',
  financeiro: 'ver o financeiro',
  presenca: 'marcar chamada',
}

const rotulo = (mapa: Record<string, string>, v: unknown) =>
  typeof v === 'string' ? (mapa[v] ?? v) : String(v)

/** Frase curta do que aconteceu, montada do `detalhe` que o gatilho gravou */
export function resumoDaLinha(l: Pick<LinhaAuditoria, 'acao' | 'detalhe'>): string {
  const d = l.detalhe ?? {}
  switch (l.acao) {
    case 'nivel':
      return `mudou de ${rotulo(NIVEL_LABEL, d.de).toLowerCase()} para ${rotulo(
        NIVEL_LABEL,
        d.para,
      ).toLowerCase()}`
    case 'presenca':
      return d.presente ? 'marcada presente' : 'marcada ausente'
    case 'entrega':
      return `concluiu ${rotulo(TIPO_LABEL as Record<TipoLinha, string>, d.tipo)}`
    case 'permissao':
      return `${d.para ? 'ganhou' : 'perdeu'} "${rotulo(PERM_LABEL, d.chave)}"`
    case 'credito':
      return (
        [
          d.cumprido ? 'dada como cumprida' : null,
          d.mentoria ? 'mentoria marcada' : null,
          d.motivo ? `— ${d.motivo}` : null,
        ]
          .filter(Boolean)
          .join(' ') || 'marca removida'
      )
  }
}

export function filtraAuditoria(
  linhas: LinhaAuditoria[],
  acao: AcaoAuditoria | 'todas',
  pessoaId: string | 'todas',
): LinhaAuditoria[] {
  return linhas.filter(
    (l) =>
      (acao === 'todas' || l.acao === acao) &&
      // "pessoa" é quem fez ou quem sofreu: fraude interessa dos dois lados
      (pessoaId === 'todas' || l.autor_id === pessoaId || l.alvo_id === pessoaId),
  )
}
