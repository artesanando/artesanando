import { supabase } from '../../lib/supabase'
import type { Receita } from '../../types/database'

/* ---------- Tipos ---------- */

export type ProjetoTipo = 'manta_croche' | 'manta_trico' | 'amigurumi'
export type SquareEtapa = 'afazer' | 'miolo' | 'aguardando_borda' | 'borda' | 'pronto'
export type FaixaStatus = 'afazer' | 'fazendo' | 'feita'

export const ETAPAS: SquareEtapa[] = ['afazer', 'miolo', 'aguardando_borda', 'borda', 'pronto']

export const ETAPA_LABEL: Record<SquareEtapa, string> = {
  afazer: 'A fazer',
  miolo: 'Miolo',
  aguardando_borda: 'Aguardando borda',
  borda: 'Borda',
  pronto: 'Pronto',
}

export interface Projeto {
  id: string
  semestre_id: string | null
  nome: string
  tipo: ProjetoTipo
  destino: string | null
  emoji: string | null
  receita_id: string | null
  meta: number | null
  colunas: number | null
  linhas: number | null
  status: 'ativo' | 'entregue' | 'arquivado'
  created_by: string | null
  arquivado_em: string | null
}

export interface MantaModelo {
  id: string
  projeto_id: string
  letra: string
  nome: string
  cor_borda: string
  cor_miolo: string
  responsavel_id: string | null
  total: number
  responsavel?: { nome: string } | null
}

export interface Square {
  id: string
  projeto_id: string
  modelo_id: string
  posicao: number
  etapa: SquareEtapa
  responsavel_id: string | null
}

export interface Faixa {
  id: string
  projeto_id: string
  ordem: number
  responsavel_id: string | null
  status: FaixaStatus
  cores: string[]
  responsavel?: { nome: string; avatar_color: string; avatar_url: string | null } | null
}

export interface Unidade {
  id: string
  projeto_id: string
  numero: number
  responsavel_id: string | null
  status: 'em_producao' | 'concluida'
  responsavel?: { nome: string } | null
}

export interface Comentario {
  id: string
  projeto_id: string
  autor_id: string
  texto: string
  created_at: string
  autor?: { nome: string; avatar_color: string; avatar_url: string | null } | null
}

export interface Atividade {
  id: string
  autor_id: string | null
  tipo: string
  projeto_id: string | null
  payload: { texto?: string; detalhe?: string }
  created_at: string
  autor?: { nome: string } | null
}

/* ---------- Fetchers ---------- */

export async function fetchProjetos(): Promise<Projeto[]> {
  const { data, error } = await supabase
    .from('projetos')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Projeto[]
}

export async function fetchProjeto(id: string): Promise<Projeto | null> {
  const { data, error } = await supabase.from('projetos').select('*').eq('id', id).single()
  if (error) return null
  return data as Projeto
}

export async function fetchReceitasAmigurumi(): Promise<Pick<Receita, 'id' | 'nome'>[]> {
  const { data, error } = await supabase
    .from('receitas')
    .select('id, nome')
    .eq('categoria', 'amigurumi')
    .order('nome')
  if (error) throw error
  return (data ?? []) as Pick<Receita, 'id' | 'nome'>[]
}

export async function fetchReceitaNome(id: string): Promise<{ id: string; nome: string } | null> {
  const { data } = await supabase.from('receitas').select('id, nome').eq('id', id).single()
  return (data as { id: string; nome: string } | null) ?? null
}

export async function fetchIntegrantesAtivas(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return (data ?? []) as { id: string; nome: string }[]
}

export async function fetchModelos(projetoId: string): Promise<MantaModelo[]> {
  const { data, error } = await supabase
    .from('manta_modelos')
    .select('*, responsavel:profiles!responsavel_id(nome)')
    .eq('projeto_id', projetoId)
    .order('letra')
  if (error) throw error
  return (data ?? []) as unknown as MantaModelo[]
}

export async function fetchSquares(projetoId: string): Promise<Square[]> {
  const { data, error } = await supabase
    .from('squares')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('posicao')
  if (error) throw error
  return (data ?? []) as Square[]
}

export async function fetchFaixas(projetoId: string): Promise<Faixa[]> {
  const { data, error } = await supabase
    .from('faixas')
    .select('*, responsavel:profiles!responsavel_id(nome, avatar_color, avatar_url)')
    .eq('projeto_id', projetoId)
    .order('ordem')
  if (error) throw error
  return (data ?? []) as unknown as Faixa[]
}

export async function fetchUnidades(projetoId: string): Promise<Unidade[]> {
  const { data, error } = await supabase
    .from('unidades')
    .select('*, responsavel:profiles!responsavel_id(nome)')
    .eq('projeto_id', projetoId)
    .order('numero')
  if (error) throw error
  return (data ?? []) as unknown as Unidade[]
}

export async function fetchComentarios(projetoId: string): Promise<Comentario[]> {
  const { data, error } = await supabase
    .from('comentarios')
    .select('*, autor:profiles!autor_id(nome, avatar_color, avatar_url)')
    .eq('projeto_id', projetoId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as unknown as Comentario[]
}

export async function fetchAtividades(projetoId: string): Promise<Atividade[]> {
  const { data, error } = await supabase
    .from('atividades')
    .select('*, autor:profiles!autor_id(nome)')
    .eq('projeto_id', projetoId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Atividade[]
}

/* progresso agregado da lista de projetos (client-side, escala pequena) */
export async function fetchProgressoGeral() {
  const [sq, fx, un] = await Promise.all([
    supabase.from('squares').select('projeto_id, etapa'),
    supabase.from('faixas').select('projeto_id, status'),
    supabase.from('unidades').select('projeto_id, status'),
  ])
  if (sq.error || fx.error || un.error) throw sq.error ?? fx.error ?? un.error
  return {
    squares: (sq.data ?? []) as Pick<Square, 'projeto_id' | 'etapa'>[],
    faixas: (fx.data ?? []) as Pick<Faixa, 'projeto_id' | 'status'>[],
    unidades: (un.data ?? []) as Pick<Unidade, 'projeto_id' | 'status'>[],
  }
}

/* ---------- Lógica derivada (unit-testada) ---------- */

export function progressoSquares(squares: Pick<Square, 'etapa'>[]) {
  const done = squares.filter((s) => s.etapa === 'pronto').length
  return { done, total: squares.length }
}

export function progressoFaixas(faixas: Pick<Faixa, 'status'>[]) {
  const done = faixas.filter((f) => f.status === 'feita').length
  return { done, total: faixas.length }
}

export function progressoUnidades(unidades: Pick<Unidade, 'status'>[], meta: number | null) {
  const done = unidades.filter((u) => u.status === 'concluida').length
  return { done, total: meta ?? unidades.length }
}

/** Etapa seguinte no fluxo do square — usada pelo avanço rápido do mapa */
export function proximaEtapa(atual: SquareEtapa): SquareEtapa {
  const i = ETAPAS.indexOf(atual)
  return ETAPAS[Math.min(i + 1, ETAPAS.length - 1)]
}

export interface ResumoEtapa {
  etapa: SquareEtapa
  total: number
  porModelo: { letra: string; nome: string; total: number }[]
}

/** Substitui o kanban de lotes: o mesmo panorama, derivado dos próprios squares */
export function resumoPorEtapa(squares: Square[], modelos: MantaModelo[]): ResumoEtapa[] {
  const porId = new Map(modelos.map((m) => [m.id, m]))
  return ETAPAS.map((etapa) => {
    const daEtapa = squares.filter((s) => s.etapa === etapa)
    const contagem = new Map<string, number>()
    for (const s of daEtapa) contagem.set(s.modelo_id, (contagem.get(s.modelo_id) ?? 0) + 1)
    return {
      etapa,
      total: daEtapa.length,
      porModelo: [...contagem.entries()]
        .map(([id, total]) => ({
          letra: porId.get(id)?.letra ?? '?',
          nome: porId.get(id)?.nome ?? 'Modelo',
          total,
        }))
        .sort((a, b) => a.letra.localeCompare(b.letra)),
    }
  })
}

/** Quantos squares prontos cada integrante entregou nesta manta */
export function squaresPorResponsavel(squares: Square[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const s of squares) {
    if (s.etapa !== 'pronto' || !s.responsavel_id) continue
    map.set(s.responsavel_id, (map.get(s.responsavel_id) ?? 0) + 1)
  }
  return map
}

/** Linha/coluna de um square na grade da manta */
export function coordenada(posicao: number, colunas: number) {
  return { linha: Math.floor(posicao / colunas) + 1, coluna: (posicao % colunas) + 1 }
}

/** Posições dentro do retângulo entre dois cantos — seleção por arrasto no mapa */
export function retangulo(de: number, ate: number, colunas: number): number[] {
  const a = coordenada(de, colunas)
  const b = coordenada(ate, colunas)
  const l1 = Math.min(a.linha, b.linha)
  const l2 = Math.max(a.linha, b.linha)
  const c1 = Math.min(a.coluna, b.coluna)
  const c2 = Math.max(a.coluna, b.coluna)
  const out: number[] = []
  for (let l = l1; l <= l2; l++) for (let c = c1; c <= c2; c++) out.push((l - 1) * colunas + (c - 1))
  return out
}

export interface GrupoUnidades {
  ini: number
  fim: number
  nome: string
  concluido: boolean
  ids: string[]
}

/** Agrupa unidades em faixas consecutivas por responsável (ex.: "#1–3 · Ana") */
export function gruposUnidades(unidades: Unidade[]): GrupoUnidades[] {
  const sorted = [...unidades].sort((a, b) => a.numero - b.numero)
  const grupos: GrupoUnidades[] = []
  for (const u of sorted) {
    const nome = u.responsavel?.nome ?? '—'
    const last = grupos[grupos.length - 1]
    if (last && last.nome === nome && u.numero === last.fim + 1) {
      last.fim = u.numero
      last.concluido = last.concluido && u.status === 'concluida'
      last.ids.push(u.id)
    } else {
      grupos.push({
        ini: u.numero,
        fim: u.numero,
        nome,
        concluido: u.status === 'concluida',
        ids: [u.id],
      })
    }
  }
  return grupos
}

/* ---------- Mutations ---------- */

export async function inserirAtividade(a: {
  autor_id: string
  tipo: string
  projeto_id: string
  payload: { texto: string; detalhe?: string }
}) {
  await supabase.from('atividades').insert(a)
}

/** Registrar produção: marca a etapa (e quem fez) dos squares selecionados no mapa */
export async function marcarSquares(opts: {
  projetoId: string
  ids: string[]
  etapa: SquareEtapa
  responsavelId: string | null
  responsavelNome: string | null
  autorId: string
}) {
  const { projetoId, ids, etapa, responsavelId, responsavelNome, autorId } = opts
  if (ids.length === 0) return

  const { error } = await supabase
    .from('squares')
    .update({ etapa, responsavel_id: etapa === 'afazer' ? null : responsavelId })
    .in('id', ids)
  if (error) throw error

  await inserirAtividade({
    autor_id: autorId,
    tipo: 'producao',
    projeto_id: projetoId,
    payload: {
      texto: `marcou ${ids.length} square${ids.length > 1 ? 's' : ''} como ${ETAPA_LABEL[etapa].toLowerCase()}`,
      detalhe: responsavelNome ?? undefined,
    },
  })
}

/** Troca dois squares de lugar no mapa (o desenho muda, o progresso vai junto) */
export async function trocarSquares(a: Square, b: Square) {
  // posicao é unique por projeto (e tem check >= 0): passa por um valor alto e
  // livre antes de cruzar, senão o UPDATE do meio colide com a posição do outro
  const limbo = 1_000_000 + a.posicao
  const passos = [
    { id: a.id, posicao: limbo },
    { id: b.id, posicao: a.posicao },
    { id: a.id, posicao: b.posicao },
  ]
  for (const p of passos) {
    const { error } = await supabase.from('squares').update({ posicao: p.posicao }).eq('id', p.id)
    if (error) throw error
  }
}

/** Pinta um modelo sobre vários squares — redesenha o padrão da manta */
export async function pintarSquares(ids: string[], modeloId: string) {
  if (ids.length === 0) return
  const { error } = await supabase.from('squares').update({ modelo_id: modeloId }).in('id', ids)
  if (error) throw error
}

export interface FaixaPatch {
  id: string
  cores?: string[]
  status?: FaixaStatus
  responsavel_id?: string | null
}

export async function salvarFaixas(mudadas: FaixaPatch[]) {
  for (const { id, ...patch } of mudadas) {
    const { error } = await supabase.from('faixas').update(patch).eq('id', id)
    if (error) throw error
  }
}

/** Pegar faixa para si; concluir; ou reabrir (admin ou a própria responsável) */
export async function mudarStatusFaixa(opts: {
  faixa: Faixa
  status: FaixaStatus
  perfilId: string
  autorId: string
}) {
  const { faixa, status, perfilId, autorId } = opts
  const patch: FaixaPatch = { id: faixa.id, status }
  if (status === 'fazendo') patch.responsavel_id = perfilId
  if (status === 'afazer') patch.responsavel_id = null
  await salvarFaixas([patch])

  const texto =
    status === 'fazendo'
      ? `pegou a faixa ${faixa.ordem}`
      : status === 'feita'
        ? `concluiu a faixa ${faixa.ordem}`
        : `reabriu a faixa ${faixa.ordem}`
  await inserirAtividade({
    autor_id: autorId,
    tipo: 'faixa',
    projeto_id: faixa.projeto_id,
    payload: { texto },
  })
}

export async function adicionarFaixa(projetoId: string, ordem: number, cores: string[]) {
  const { error } = await supabase
    .from('faixas')
    .insert({ projeto_id: projetoId, ordem, cores })
  if (error) throw error
}

export async function removerFaixa(id: string) {
  const { error } = await supabase.from('faixas').delete().eq('id', id)
  if (error) throw error
}

/** Cria N unidades de uma vez para a mesma integrante */
export async function adicionarUnidades(
  projetoId: string,
  aPartirDe: number,
  quantidade: number,
  responsavelId: string,
) {
  const linhas = Array.from({ length: quantidade }, (_, i) => ({
    projeto_id: projetoId,
    numero: aPartirDe + i,
    responsavel_id: responsavelId,
  }))
  const { error } = await supabase.from('unidades').insert(linhas)
  if (error) throw error
}

export async function reatribuirUnidades(ids: string[], responsavelId: string) {
  const { error } = await supabase
    .from('unidades')
    .update({ responsavel_id: responsavelId })
    .in('id', ids)
  if (error) throw error
}

export async function removerUnidades(ids: string[]) {
  const { error } = await supabase.from('unidades').delete().in('id', ids)
  if (error) throw error
}

export async function reabrirUnidades(ids: string[]) {
  const { error } = await supabase
    .from('unidades')
    .update({ status: 'em_producao' })
    .in('id', ids)
  if (error) throw error
}

export async function concluirUnidades(ids: string[]) {
  const { error } = await supabase
    .from('unidades')
    .update({ status: 'concluida' })
    .in('id', ids)
  if (error) throw error
}

export async function editarComentario(id: string, texto: string) {
  const { error } = await supabase.from('comentarios').update({ texto }).eq('id', id)
  if (error) throw error
}

export async function apagarComentario(id: string) {
  const { error } = await supabase.from('comentarios').delete().eq('id', id)
  if (error) throw error
}

export async function comentar(projetoId: string, autorId: string, texto: string) {
  const { error } = await supabase
    .from('comentarios')
    .insert({ projeto_id: projetoId, autor_id: autorId, texto })
  if (error) throw error
}

export interface ModeloNovo {
  letra: string
  nome: string
  cor_borda: string
  cor_miolo: string
}

export interface NovoProjeto {
  nome: string
  tipo: ProjetoTipo
  destino: string | null
  emoji: string | null
  receita_id?: string | null
  meta?: number | null
  created_by: string
  // manta crochê: grade e modelos (do zero ou vindos de um esquema da biblioteca)
  colunas?: number
  linhas?: number
  modelos?: ModeloNovo[]
  celulas?: string[][]
  // manta tricô: padrão das faixas
  faixaSeq?: string[]
  faixaCount?: number
}

/** Grade padrão quando a manta começa do zero: alterna os modelos em xadrez */
export function gradePadrao(colunas: number, linhas: number, letras: string[]): string[][] {
  return Array.from({ length: linhas }, (_, l) =>
    Array.from({ length: colunas }, (_, c) => letras[(l + c) % letras.length]),
  )
}

export async function criarProjeto(novo: NovoProjeto): Promise<string> {
  // manta de crochê nasce inteira numa transação só (projeto + modelos + squares),
  // senão uma falha no meio deixava um projeto pela metade
  if (novo.tipo === 'manta_croche') {
    const modelos = novo.modelos ?? []
    const colunas = novo.colunas ?? 8
    const linhas = novo.linhas ?? 10
    const { data, error } = await supabase.rpc('criar_projeto_manta', {
      p_nome: novo.nome,
      p_destino: novo.destino,
      p_emoji: novo.emoji,
      p_colunas: colunas,
      p_linhas: linhas,
      p_modelos: modelos,
      p_celulas: novo.celulas ?? gradePadrao(colunas, linhas, modelos.map((m) => m.letra)),
    })
    if (error) throw error
    return data as string
  }

  const { data: sem } = await supabase
    .from('semestres')
    .select('id')
    .eq('ativo', true)
    .maybeSingle()
  const { data, error } = await supabase
    .from('projetos')
    .insert({
      semestre_id: (sem as { id: string } | null)?.id ?? null,
      nome: novo.nome,
      tipo: novo.tipo,
      destino: novo.destino,
      emoji: novo.emoji,
      receita_id: novo.receita_id ?? null,
      meta: novo.meta ?? null,
      created_by: novo.created_by,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('sem id')
  const projetoId = (data as { id: string }).id

  if (novo.tipo === 'manta_trico') {
    const seq = novo.faixaSeq ?? []
    const count = novo.faixaCount ?? 8
    const faixas = Array.from({ length: count }, (_, i) => ({
      projeto_id: projetoId,
      ordem: i + 1,
      cores: seq,
    }))
    const { error: e3 } = await supabase.from('faixas').insert(faixas)
    if (e3) throw e3
  }

  await inserirAtividade({
    autor_id: novo.created_by,
    tipo: 'projeto',
    projeto_id: projetoId,
    payload: { texto: `criou o projeto ${novo.nome}` },
  })

  return projetoId
}

export async function atualizarProjeto(
  id: string,
  patch: Partial<Pick<Projeto, 'nome' | 'destino' | 'emoji' | 'meta' | 'receita_id' | 'status'>>,
) {
  const { error } = await supabase.from('projetos').update(patch).eq('id', id)
  if (error) throw error
}

/* ---------- Estrutura da manta (admin) ---------- */

export async function redimensionarManta(projetoId: string, colunas: number, linhas: number) {
  const { error } = await supabase.rpc('redimensionar_manta', {
    p_projeto: projetoId,
    p_colunas: colunas,
    p_linhas: linhas,
  })
  if (error) throw error
}

/** Quantos squares já feitos somem se a manta encolher para este tamanho */
export async function squaresPerdidos(projetoId: string, colunas: number, linhas: number) {
  const { data, error } = await supabase.rpc('squares_perdidos', {
    p_projeto: projetoId,
    p_colunas: colunas,
    p_linhas: linhas,
  })
  if (error) throw error
  return (data as number) ?? 0
}

export async function atualizarModelo(
  id: string,
  patch: Partial<Pick<MantaModelo, 'nome' | 'cor_borda' | 'cor_miolo'>>,
) {
  const { error } = await supabase.from('manta_modelos').update(patch).eq('id', id)
  if (error) throw error
}
