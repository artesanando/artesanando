import { supabase } from '../../lib/supabase'
import type { Receita, ReceitaCategoria, ReceitaConteudo } from '../../types/database'

export async function fetchReceitas(): Promise<Receita[]> {
  const { data, error } = await supabase
    .from('receitas')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Receita[]
}

export interface NovaReceita {
  nome: string
  categoria: ReceitaCategoria
  sub: string | null
  resumo: string | null
  specs: [string, string][]
  conteudo: ReceitaConteudo
  pdf_path?: string | null
  video_url?: string | null
  capa_path?: string | null
  origem: 'manual' | 'criador'
  criado_por: string
}

export async function criarReceita(r: NovaReceita) {
  const { error } = await supabase.from('receitas').insert(r)
  if (error) throw error
}

export async function uploadPdf(file: File): Promise<string> {
  const path = `${crypto.randomUUID()}.pdf`
  const { error } = await supabase.storage.from('receitas').upload(path, file, {
    contentType: 'application/pdf',
  })
  if (error) throw error
  return path
}

export async function abrirPdf(path: string) {
  const { data, error } = await supabase.storage.from('receitas').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) throw error ?? new Error('sem url')
  window.open(data.signedUrl, '_blank', 'noopener')
}

/** Filtro de busca + categoria usado pela Biblioteca (client-side) */
export function filtraReceitas(
  receitas: Receita[],
  busca: string,
  cat: ReceitaCategoria | 'todos',
): Receita[] {
  const q = busca.trim().toLowerCase()
  return receitas.filter((r) => {
    if (cat !== 'todos' && r.categoria !== cat) return false
    if (!q) return true
    return [r.nome, r.sub ?? '', r.resumo ?? ''].some((t) => t.toLowerCase().includes(q))
  })
}
