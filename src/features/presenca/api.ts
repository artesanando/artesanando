import { supabase } from '../../lib/supabase'
import { corSorteada } from '../../lib/paleta'
import {
  turnoDaPessoa,
  turnoDoEncontro,
  type Profile,
  type Turno,
  type TurnoEncontro,
} from '../../types/database'

export interface Encontro {
  id: string
  semestre_id: string | null
  data: string
  hora: string | null
  local: string | null
  pauta: string | null
  turno: TurnoEncontro
  cancelado_em: string | null
  serie_id: string | null
  arquivado_em: string | null
}

export interface Presenca {
  encontro_id: string
  integrante_id: string
  presente: boolean
  marcado_por: string | null
}

export async function fetchEncontros(): Promise<Encontro[]> {
  const { data, error } = await supabase
    .from('encontros')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return ((data ?? []) as Encontro[]).map((e) => ({ ...e, turno: turnoDoEncontro(e.turno) }))
}

export async function fetchPresencas(): Promise<Presenca[]> {
  const { data, error } = await supabase.from('presencas').select('*')
  if (error) throw error
  return (data ?? []) as Presenca[]
}

export type IntegranteChamada = Pick<
  Profile,
  'id' | 'nome' | 'avatar_color' | 'avatar_url' | 'user_id' | 'turno'
>

export async function fetchIntegrantesAtivas(): Promise<IntegranteChamada[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, avatar_color, avatar_url, user_id, turno')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return ((data ?? []) as IntegranteChamada[]).map((p) => ({
    ...p,
    turno: turnoDaPessoa(p.turno),
  }))
}

/** Chamada clicável: upsert na PK (encontro, integrante) */
export async function marcarPresenca(p: {
  encontro_id: string
  integrante_id: string
  presente: boolean
  marcado_por: string
}) {
  const { error } = await supabase.from('presencas').upsert(p)
  if (error) throw error
}

export interface NovoEncontro {
  data: string
  hora: string
  local: string
  pauta: string
  turno: TurnoEncontro
}

/**
 * Cria um encontro, ou a série semanal inteira até o fim do semestre ativo.
 * Devolve quantos foram criados — a tela avisa antes de gravar dezenas de linhas.
 */
export async function criarEncontro(e: NovoEncontro, repetirSemanal = false): Promise<number> {
  const { data: sem } = await supabase
    .from('semestres')
    .select('id, fim')
    .eq('ativo', true)
    .maybeSingle()
  const semestre = sem as { id: string; fim: string | null } | null

  const datas = repetirSemanal ? datasSemanais(e.data, semestre?.fim ?? null) : [e.data]
  const serie = repetirSemanal && datas.length > 1 ? crypto.randomUUID() : null

  const { error } = await supabase.from('encontros').insert(
    datas.map((data) => ({
      ...e,
      data,
      serie_id: serie,
      semestre_id: semestre?.id ?? null,
    })),
  )
  if (error) throw error
  return datas.length
}

export async function atualizarEncontro(
  id: string,
  patch: Partial<Pick<Encontro, 'data' | 'hora' | 'local' | 'pauta' | 'turno'>>,
) {
  const { error } = await supabase.from('encontros').update(patch).eq('id', id)
  if (error) throw error
}

/* Cancelar não é arquivar: o encontro continua visível no calendário, riscado,
   e some das duas contas de frequência — recesso não é falta de ninguém. */
export async function definirCancelado(id: string, cancelado: boolean) {
  const { error } = await supabase
    .from('encontros')
    .update({ cancelado_em: cancelado ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) throw error
}

/* Integrante que só aparece na chamada: um perfil sem conta de acesso. Quando
   ela for convidada depois, o trigger do banco liga a conta a este mesmo perfil
   e as presenças de hoje continuam sendo dela. */
export async function criarIntegranteSemConta(nome: string, turno: Turno = 'ambos'): Promise<string> {
  const base = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira os acentos que o NFD separou
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      nome: nome.trim(),
      usuario: `${base}.${Date.now().toString(36).slice(-4)}`,
      turno,
      avatar_color: corSorteada(),
    })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

/* ---------- Derivados (unit-testados) ---------- */

/** Datas de sete em sete dias, da primeira até o fim do semestre (inclusive) */
export function datasSemanais(inicio: string, fim: string | null, limite = 40): string[] {
  if (!fim || fim < inicio) return [inicio]
  const datas: string[] = []
  const d = new Date(`${inicio}T12:00:00`)
  const ate = new Date(`${fim}T12:00:00`)
  while (d <= ate && datas.length < limite) {
    datas.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return datas.length > 0 ? datas : [inicio]
}

/** Encontro que conta para frequência: não cancelado e não arquivado */
export const contaNaFrequencia = (e: Encontro) => !e.cancelado_em && !e.arquivado_em

export function encontrosPassados(encontros: Encontro[], hoje: string): Encontro[] {
  return encontros.filter((e) => e.data <= hoje).sort((a, b) => b.data.localeCompare(a.data))
}

export function proximosEncontros(encontros: Encontro[], hoje: string): Encontro[] {
  return encontros.filter((e) => e.data > hoje).sort((a, b) => a.data.localeCompare(b.data))
}

export function proximoEncontro(encontros: Encontro[], hoje: string): Encontro | undefined {
  return proximosEncontros(encontros, hoje)[0]
}

export function presentesDe(presencas: Presenca[], encontroId: string): number {
  return presencas.filter((p) => p.encontro_id === encontroId && p.presente).length
}

export function mediaPresentes(encontros: Encontro[], presencas: Presenca[], hoje: string): number {
  const passados = encontrosPassados(encontros, hoje).filter(contaNaFrequencia)
  if (passados.length === 0) return 0
  const total = passados.reduce((s, e) => s + presentesDe(presencas, e.id), 0)
  return Math.round(total / passados.length)
}

export interface Frequencia {
  diurno: { presentes: number; total: number; pct: number }
  noturno: { presentes: number; total: number; pct: number }
  total: { presentes: number; total: number; pct: number }
}

const parcial = (presentes: number, total: number) => ({
  presentes,
  total,
  pct: total === 0 ? 0 : Math.round((presentes / total) * 100),
})

/**
 * Frequência separada por turno e no total.
 *
 * Encontro cancelado não entra em nenhum denominador. O total respeita o turno
 * da integrante: quem é do noturno não leva falta por encontro diurno, e quem é
 * `ambos` conta os dois — que é o comportamento de sempre.
 */
export function frequenciaDe(
  integranteId: string,
  encontros: Encontro[],
  presencas: Presenca[],
  hoje: string,
  turnoDela: Turno = 'ambos',
): Frequencia {
  const passados = encontrosPassados(encontros, hoje).filter(contaNaFrequencia)
  const esteve = (e: Encontro) =>
    presencas.some((p) => p.encontro_id === e.id && p.integrante_id === integranteId && p.presente)

  const doTurno = (t: TurnoEncontro) => passados.filter((e) => e.turno === t)
  const diurno = doTurno('diurno')
  const noturno = doTurno('noturno')

  // o denominador do total só inclui os turnos que são dela
  const contamNoTotal = passados.filter(
    (e) => turnoDela === 'ambos' || e.turno === turnoDela,
  )

  return {
    diurno: parcial(diurno.filter(esteve).length, diurno.length),
    noturno: parcial(noturno.filter(esteve).length, noturno.length),
    total: parcial(contamNoTotal.filter(esteve).length, contamNoTotal.length),
  }
}
