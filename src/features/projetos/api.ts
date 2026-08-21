import { supabase } from '../../lib/supabase'
import { faixasDaManta, gradePadrao } from '../../lib/grade'
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
  receita_id: string | null
  meta: number | null
  colunas: number | null
  linhas: number | null
  /** tamanho de um square (crochê) ou de uma faixa (tricô), em cm */
  peca_largura_cm: number | null
  peca_altura_cm: number | null
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
  /** todas as carreiras, do miolo para fora; nulo no que foi criado com duas cores */
  cores: string[] | null
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
  /** quem fez cada metade — meio square também é entrega */
  miolo_por: string | null
  borda_por: string | null
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

/* Um comentário pende de um projeto OU de um item da biblioteca, nunca dos dois
   — o CHECK do banco garante. Daí o alvo ser um par discriminado, e não dois
   parâmetros opcionais que alguém poderia passar juntos. */
export type AlvoComentario = { projetoId: string } | { receitaId: string }

export interface Comentario {
  id: string
  projeto_id: string | null
  receita_id: string | null
  autor_id: string
  texto: string
  foto_path: string | null
  created_at: string
  autor?: { nome: string; avatar_color: string; avatar_url: string | null } | null
}

export const chaveComentarios = (alvo: AlvoComentario) =>
  'projetoId' in alvo ? ['comentarios', 'projeto', alvo.projetoId] : ['comentarios', 'receita', alvo.receitaId]

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

export async function fetchComentarios(alvo: AlvoComentario): Promise<Comentario[]> {
  const q = supabase
    .from('comentarios')
    .select('*, autor:profiles!autor_id(nome, avatar_color, avatar_url)')
  const { data, error } = await ('projetoId' in alvo
    ? q.eq('projeto_id', alvo.projetoId)
    : q.eq('receita_id', alvo.receitaId)
  ).order('created_at')
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

export interface GrupoUnidades {
  ini: number
  fim: number
  nome: string
  concluido: boolean
  ids: string[]
}

/* Agrupa unidades em faixas consecutivas por responsável (ex.: "#1–3 · Ana").
   O status também quebra o grupo: depois de concluir 2 de 5, o que sobra tem
   que aparecer como duas faixas — senão "#1–5" continuava marcado como em
   produção e escondia o que já foi entregue. */
export function gruposUnidades(unidades: Unidade[]): GrupoUnidades[] {
  const sorted = [...unidades].sort((a, b) => a.numero - b.numero)
  const grupos: GrupoUnidades[] = []
  for (const u of sorted) {
    const nome = u.responsavel?.nome ?? '—'
    const concluida = u.status === 'concluida'
    const last = grupos[grupos.length - 1]
    if (last && last.nome === nome && last.concluido === concluida && u.numero === last.fim + 1) {
      last.fim = u.numero
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
/* Cada metade do square guarda quem a fez. Voltar uma etapa limpa a metade
   correspondente — senão alguém levaria crédito por trabalho desfeito. */
function creditoDaEtapa(etapa: SquareEtapa, quem: string | null) {
  switch (etapa) {
    case 'afazer':
      return { miolo_por: null, borda_por: null }
    case 'miolo':
    case 'aguardando_borda':
      return { miolo_por: quem, borda_por: null }
    default:
      return { borda_por: quem }
  }
}

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
    .update({
      etapa,
      responsavel_id: etapa === 'afazer' ? null : responsavelId,
      // quem fez o miolo não pode ser apagada quando outra pessoa marca a borda:
      // o normal aqui é o square ser dividido entre duas
      ...creditoDaEtapa(etapa, responsavelId),
    })
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

export async function comentar(
  alvo: AlvoComentario,
  autorId: string,
  texto: string,
  fotoPath: string | null = null,
) {
  const { error } = await supabase.from('comentarios').insert({
    ...('projetoId' in alvo ? { projeto_id: alvo.projetoId } : { receita_id: alvo.receitaId }),
    autor_id: autorId,
    texto,
    foto_path: fotoPath,
  })
  if (error) throw error
}

/* Foto de comentário vai como está, sem passar pelo recorte: quem fotografa o
   progresso quer mandar e seguir, não enquadrar. */
export async function subirFotoComentario(arquivo: File): Promise<string> {
  const ext = arquivo.name.split('.').pop()?.toLowerCase() || 'jpg'
  const caminho = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('comentarios')
    .upload(caminho, arquivo, { contentType: arquivo.type || 'image/jpeg' })
  if (error) throw error
  return caminho
}

export async function urlsDasFotos(caminhos: string[]): Promise<Map<string, string>> {
  if (caminhos.length === 0) return new Map()
  const { data } = await supabase.storage.from('comentarios').createSignedUrls(caminhos, 60 * 60 * 8)
  const mapa = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl)
  }
  return mapa
}

export interface ModeloNovo {
  letra: string
  nome: string
  /* Continuam sendo o primeiro e o último anel: são `not null` no banco e o
     fallback de tudo que foi criado quando o modelo só tinha duas cores. */
  cor_borda: string
  cor_miolo: string
  /** todas as carreiras, do miolo para fora */
  cores?: string[]
  /** de qual granny da biblioteca este modelo veio */
  receita_id?: string
  /** as cores foram mexidas depois de puxar o padrão */
  ajustado?: boolean
}

export interface NovoProjeto {
  nome: string
  tipo: ProjetoTipo
  destino: string | null
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
  /** faixas desenhadas uma a uma no esquema, quando o padrão foi editado livre */
  faixaCores?: string[][]
  // tamanho de um square (crochê) ou de uma faixa (tricô), em cm
  pecaLarguraCm?: number | null
  pecaAlturaCm?: number | null
}

/** Grade padrão quando a manta começa do zero: alterna os modelos em xadrez */
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
      p_emoji: null,
      p_colunas: colunas,
      p_linhas: linhas,
      p_modelos: modelos,
      p_celulas: novo.celulas ?? gradePadrao(colunas, linhas, modelos.map((m) => m.letra)),
      p_peca_largura_cm: novo.pecaLarguraCm ?? null,
      p_peca_altura_cm: novo.pecaAlturaCm ?? null,
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
      receita_id: novo.receita_id ?? null,
      meta: novo.meta ?? null,
      peca_largura_cm: novo.pecaLarguraCm ?? null,
      peca_altura_cm: novo.pecaAlturaCm ?? null,
      created_by: novo.created_by,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('sem id')
  const projetoId = (data as { id: string }).id

  if (novo.tipo === 'manta_trico') {
    const seq = novo.faixaSeq ?? []
    const count = novo.faixaCount ?? 8
    // as faixas desenhadas à mão no esquema vêm inteiras; as demais deslocam a
    // sequência uma posição, que é o que faz as cores caminharem na diagonal
    // em vez de virarem blocos retos
    const linhas = faixasDaManta(seq, count, novo.faixaCores)
    const faixas = linhas.map((cores, i) => ({
      projeto_id: projetoId,
      ordem: i + 1,
      cores,
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
  patch: Partial<Pick<Projeto, 'nome' | 'destino' | 'meta' | 'receita_id' | 'status'>>,
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
