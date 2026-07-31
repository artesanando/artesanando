import { supabase } from '../../lib/supabase'

/* ---------- Tipos ---------- */

export type ProjetoTipo = 'manta_croche' | 'manta_trico' | 'amigurumi'
export type SquareEtapa = 'afazer' | 'miolo' | 'aguardando_borda' | 'borda' | 'pronto'
export type LoteEtapa = 'miolo' | 'aguardando_borda' | 'borda' | 'pronto'
export type FaixaStatus = 'afazer' | 'fazendo' | 'feita'

export interface Projeto {
  id: string
  semestre_id: string | null
  nome: string
  tipo: ProjetoTipo
  destino: string | null
  emoji: string | null
  receita_id: string | null
  meta: number | null
  status: 'ativo' | 'entregue' | 'arquivado'
  created_by: string | null
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
  lote_id: string | null
}

export interface Lote {
  id: string
  projeto_id: string
  modelo_id: string
  quantidade: number
  etapa: LoteEtapa
  responsavel_id: string | null
  obs: string | null
  responsavel?: { nome: string } | null
  modelo?: { letra: string; nome: string } | null
}

export interface Faixa {
  id: string
  projeto_id: string
  ordem: number
  responsavel_id: string | null
  status: FaixaStatus
  cores: string[]
  responsavel?: { nome: string; avatar_color: string } | null
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
  autor?: { nome: string; avatar_color: string } | null
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

export async function fetchLotes(projetoId: string): Promise<Lote[]> {
  const { data, error } = await supabase
    .from('lotes')
    .select('*, responsavel:profiles!responsavel_id(nome), modelo:manta_modelos!modelo_id(letra, nome)')
    .eq('projeto_id', projetoId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as unknown as Lote[]
}

export async function fetchFaixas(projetoId: string): Promise<Faixa[]> {
  const { data, error } = await supabase
    .from('faixas')
    .select('*, responsavel:profiles!responsavel_id(nome, avatar_color)')
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
    .select('*, autor:profiles!autor_id(nome, avatar_color)')
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

/** Etapa para onde os squares vão quando uma etapa é concluída */
export function proximaEtapa(concluida: 'miolo' | 'borda' | 'pronto'): SquareEtapa {
  if (concluida === 'miolo') return 'aguardando_borda'
  return 'pronto'
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

/** Assumir um lote "precisa de alguém": vira borda em andamento da integrante */
export async function pegarLote(lote: Lote, userId: string) {
  const { error } = await supabase
    .from('lotes')
    .update({ responsavel_id: userId, etapa: 'borda' })
    .eq('id', lote.id)
  if (error) throw error
  await supabase.from('squares').update({ etapa: 'borda' }).eq('lote_id', lote.id)
  await inserirAtividade({
    autor_id: userId,
    tipo: 'lote',
    projeto_id: lote.projeto_id,
    payload: {
      texto: `pegou ${lote.modelo?.nome ?? 'lote'} ×${lote.quantidade}`,
      detalhe: 'aguardando → borda',
    },
  })
}

/** Registrar produção: move N squares do lote para a próxima etapa */
export async function registrarProducao(opts: {
  lote: Lote
  quantidade: number
  etapaConcluida: 'miolo' | 'borda' | 'pronto'
  responsavelNome: string
  autorId: string
}) {
  const { lote, quantidade, etapaConcluida, responsavelNome, autorId } = opts
  const destino = proximaEtapa(etapaConcluida)

  const { data: squares, error } = await supabase
    .from('squares')
    .select('id')
    .eq('lote_id', lote.id)
    .order('posicao')
  if (error) throw error
  const ids = ((squares ?? []) as { id: string }[]).slice(0, quantidade).map((s) => s.id)
  const restam = (squares?.length ?? 0) - ids.length

  if (ids.length > 0) {
    const patch =
      destino === 'pronto' ? { etapa: destino, lote_id: null } : { etapa: destino }
    const { error: e2 } = await supabase.from('squares').update(patch).in('id', ids)
    if (e2) throw e2
  }

  if (destino === 'pronto') {
    if (restam === 0) await supabase.from('lotes').delete().eq('id', lote.id)
    else await supabase.from('lotes').update({ quantidade: restam }).eq('id', lote.id)
  } else {
    // miolo concluído → lote aguarda alguém pegar a borda
    await supabase
      .from('lotes')
      .update({ etapa: destino, responsavel_id: null, quantidade: ids.length })
      .eq('id', lote.id)
  }

  await inserirAtividade({
    autor_id: autorId,
    tipo: 'producao',
    projeto_id: lote.projeto_id,
    payload: {
      texto: `registrou ${etapaConcluida} de ${lote.modelo?.nome ?? 'lote'} ×${ids.length} (${responsavelNome})`,
      detalhe: `→ ${destino.replace('_', ' ')}`,
    },
  })
}

export async function salvarFaixas(mudadas: { id: string; cores: string[] }[]) {
  for (const f of mudadas) {
    const { error } = await supabase.from('faixas').update({ cores: f.cores }).eq('id', f.id)
    if (error) throw error
  }
}

export async function adicionarUnidade(projetoId: string, numero: number, responsavelId: string) {
  const { error } = await supabase
    .from('unidades')
    .insert({ projeto_id: projetoId, numero, responsavel_id: responsavelId })
  if (error) throw error
}

export async function concluirUnidades(ids: string[]) {
  const { error } = await supabase
    .from('unidades')
    .update({ status: 'concluida' })
    .in('id', ids)
  if (error) throw error
}

export async function comentar(projetoId: string, autorId: string, texto: string) {
  const { error } = await supabase
    .from('comentarios')
    .insert({ projeto_id: projetoId, autor_id: autorId, texto })
  if (error) throw error
}

export interface NovoProjeto {
  nome: string
  tipo: ProjetoTipo
  destino: string | null
  emoji: string | null
  receita_id?: string | null
  meta?: number | null
  created_by: string
  // manta tricô: padrão das faixas
  faixaSeq?: string[]
  faixaCount?: number
}

const MODELOS_PADRAO = [
  { letra: 'A', nome: 'Modelo A — Flor de Maio', cor_borda: '#C4798A', cor_miolo: '#DFA2AC', total: 40 },
  { letra: 'B', nome: 'Modelo B — Sunburst', cor_borda: '#B99BC4', cor_miolo: '#E3C07A', total: 24 },
  { letra: 'C', nome: 'Modelo C — Clássico', cor_borda: '#7D9B76', cor_miolo: '#A9BFA3', total: 16 },
]

export async function criarProjeto(novo: NovoProjeto): Promise<string> {
  const { data: sem } = await supabase.from('semestres').select('id').eq('ativo', true).single()
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

  if (novo.tipo === 'manta_croche') {
    const { data: modelos, error: e1 } = await supabase
      .from('manta_modelos')
      .insert(MODELOS_PADRAO.map((m) => ({ ...m, projeto_id: projetoId })))
      .select('id, letra')
    if (e1) throw e1
    const porLetra = Object.fromEntries(
      ((modelos ?? []) as { id: string; letra: string }[]).map((m) => [m.letra, m.id]),
    )
    // mesma distribuição embaralhada do protótipo: posição p ← índice (p*13)%80
    const squares = Array.from({ length: 80 }, (_, p) => {
      const i = (p * 13) % 80
      const letra = i < 40 ? 'A' : i < 64 ? 'B' : 'C'
      return { projeto_id: projetoId, modelo_id: porLetra[letra], posicao: p, etapa: 'afazer' }
    })
    const { error: e2 } = await supabase.from('squares').insert(squares)
    if (e2) throw e2
  }

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
