import { supabase } from '../../lib/supabase'

export type TipoArquivo = 'foto' | 'documento'

export interface ArquivoExtensao {
  id: string
  semestre_id: string | null
  titulo: string
  tipo: TipoArquivo
  path: string
  data: string
  criado_por: string | null
  created_at: string
}

export async function fetchArquivos(semestreId: string | null): Promise<ArquivoExtensao[]> {
  let q = supabase.from('arquivos_extensao').select('*').order('data', { ascending: false })
  if (semestreId) q = q.eq('semestre_id', semestreId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as ArquivoExtensao[]
}

export async function subirArquivo(arquivo: File, dados: {
  titulo: string
  tipo: TipoArquivo
  data: string
  semestreId: string | null
  criadoPor: string
}) {
  const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${dados.semestreId ?? 'sem-semestre'}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from('extensao').upload(path, arquivo, {
    contentType: arquivo.type || undefined,
  })
  if (up.error) throw up.error

  const { error } = await supabase.from('arquivos_extensao').insert({
    semestre_id: dados.semestreId,
    titulo: dados.titulo,
    tipo: dados.tipo,
    path,
    data: dados.data,
    criado_por: dados.criadoPor,
  })
  if (error) throw error
}

export async function removerArquivo(a: ArquivoExtensao) {
  await supabase.storage.from('extensao').remove([a.path])
  const { error } = await supabase.from('arquivos_extensao').delete().eq('id', a.id)
  if (error) throw error
}

export async function abrirArquivo(path: string) {
  const { data, error } = await supabase.storage.from('extensao').createSignedUrl(path, 3600)
  if (error || !data?.signedUrl) throw error ?? new Error('sem url')
  window.open(data.signedUrl, '_blank', 'noopener')
}

/** URLs assinadas das fotos, para a galeria mostrar as miniaturas */
export async function urlsDosArquivos(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()
  const { data } = await supabase.storage.from('extensao').createSignedUrls(paths, 3600)
  const map = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}

/* ---------- Derivados (unit-testados) ---------- */

/** Uma linha por integrante, pronta para copiar para o relatório do semestre */
export function linhasDoRelatorio(
  linhas: { nome: string; diurno: string; noturno: string; total: string; entregas: number }[],
): string {
  const cab = ['Integrante', 'Diurno', 'Noturno', 'Total', 'Entregas'].join('\t')
  const corpo = linhas.map((l) => [l.nome, l.diurno, l.noturno, l.total, l.entregas].join('\t'))
  return [cab, ...corpo].join('\n')
}
