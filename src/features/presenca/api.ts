import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'

export interface Encontro {
  id: string
  semestre_id: string | null
  data: string
  hora: string | null
  local: string | null
  pauta: string | null
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
  return (data ?? []) as Encontro[]
}

export async function fetchPresencas(): Promise<Presenca[]> {
  const { data, error } = await supabase.from('presencas').select('*')
  if (error) throw error
  return (data ?? []) as Presenca[]
}

export async function fetchIntegrantesAtivas(): Promise<
  Pick<Profile, 'id' | 'nome' | 'avatar_color' | 'avatar_url' | 'user_id'>[]
> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, avatar_color, avatar_url, user_id')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return (data ?? []) as Pick<Profile, 'id' | 'nome' | 'avatar_color' | 'avatar_url' | 'user_id'>[]
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

export async function criarEncontro(e: {
  data: string
  hora: string
  local: string
  pauta: string
}) {
  const { data: sem } = await supabase
    .from('semestres')
    .select('id')
    .eq('ativo', true)
    .maybeSingle()
  const { error } = await supabase
    .from('encontros')
    .insert({ ...e, semestre_id: (sem as { id: string } | null)?.id ?? null })
  if (error) throw error
}

export async function atualizarEncontro(
  id: string,
  patch: Partial<Pick<Encontro, 'data' | 'hora' | 'local' | 'pauta'>>,
) {
  const { error } = await supabase.from('encontros').update(patch).eq('id', id)
  if (error) throw error
}

/* Integrante que só aparece na chamada: um perfil sem conta de acesso. Quando
   ela for convidada depois, o trigger do banco liga a conta a este mesmo perfil
   e as presenças de hoje continuam sendo dela. */
export async function criarIntegranteSemConta(nome: string): Promise<string> {
  const base = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira os acentos que o NFD separou
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  const { data, error } = await supabase
    .from('profiles')
    .insert({ nome: nome.trim(), usuario: `${base}.${Date.now().toString(36).slice(-4)}` })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

/** Encontros que batem com a busca por data, sala ou pauta */
export function filtraEncontros(encontros: Encontro[], busca: string): Encontro[] {
  const q = busca.trim().toLowerCase()
  if (!q) return encontros
  return encontros.filter((e) =>
    [e.data, e.local ?? '', e.pauta ?? '', e.hora ?? ''].some((t) => t.toLowerCase().includes(q)),
  )
}

/* ---------- Derivados (unit-testados) ---------- */

export function encontrosPassados(encontros: Encontro[], hoje: string): Encontro[] {
  return encontros.filter((e) => e.data <= hoje).sort((a, b) => b.data.localeCompare(a.data))
}

export function proximoEncontro(encontros: Encontro[], hoje: string): Encontro | undefined {
  return encontros
    .filter((e) => e.data > hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0]
}

export function presentesDe(presencas: Presenca[], encontroId: string): number {
  return presencas.filter((p) => p.encontro_id === encontroId && p.presente).length
}

export function mediaPresentes(encontros: Encontro[], presencas: Presenca[], hoje: string): number {
  const passados = encontrosPassados(encontros, hoje)
  if (passados.length === 0) return 0
  const total = passados.reduce((s, e) => s + presentesDe(presencas, e.id), 0)
  return Math.round(total / passados.length)
}

/** Frequência de uma integrante: presenças / encontros passados */
export function frequenciaDe(
  integranteId: string,
  encontros: Encontro[],
  presencas: Presenca[],
  hoje: string,
): { presentes: number; total: number; pct: number } {
  const passados = encontrosPassados(encontros, hoje)
  const presentes = passados.filter((e) =>
    presencas.some((p) => p.encontro_id === e.id && p.integrante_id === integranteId && p.presente),
  ).length
  const total = passados.length
  return { presentes, total, pct: total === 0 ? 0 : Math.round((presentes / total) * 100) }
}
