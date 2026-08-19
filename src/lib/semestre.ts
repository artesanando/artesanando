import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Semestre } from '../types/database'

/* O semestre estava escrito à mão como "2026.2" em Projetos e no Financeiro,
   ignorando a tabela `semestres` que existe desde a primeira migration. */

export async function fetchSemestreAtivo(): Promise<Semestre | null> {
  const { data } = await supabase.from('semestres').select('*').eq('ativo', true).maybeSingle()
  return (data as Semestre | null) ?? null
}

export async function fetchSemestres(): Promise<Semestre[]> {
  const { data, error } = await supabase
    .from('semestres')
    .select('*')
    .order('inicio', { ascending: false })
  if (error) throw error
  return (data ?? []) as Semestre[]
}

export function useSemestreAtivo() {
  const { data } = useQuery({ queryKey: ['semestre-ativo'], queryFn: fetchSemestreAtivo })
  return data ?? null
}

/** Rótulo do semestre ativo, ou '—' enquanto não houver nenhum marcado */
export function useLabelSemestre() {
  return useSemestreAtivo()?.label ?? '—'
}

export async function criarSemestre(s: Omit<Semestre, 'id'>) {
  const { error } = await supabase.from('semestres').insert(s)
  if (error) throw error
}

export async function atualizarSemestre(id: string, patch: Partial<Omit<Semestre, 'id'>>) {
  const { error } = await supabase.from('semestres').update(patch).eq('id', id)
  if (error) throw error
}

/** Só um semestre fica ativo por vez */
export async function ativarSemestre(id: string) {
  const desliga = await supabase.from('semestres').update({ ativo: false }).eq('ativo', true)
  if (desliga.error) throw desliga.error
  const liga = await supabase.from('semestres').update({ ativo: true }).eq('id', id)
  if (liga.error) throw liga.error
}
