import { supabase } from './supabase'

/* Foto de capa de receita e de material. Vai para o bucket `capas` e é servida
   por URL assinada — o bucket é privado como os outros. Sem capa, o card usa a
   cor sólida da categoria, que continua sendo o caso mais comum. */

export const CAPA_PROPORCAO = 4 / 3
const CAPA_LARGURA = 640

export const CAPA_SAIDA = {
  largura: CAPA_LARGURA,
  altura: Math.round(CAPA_LARGURA / CAPA_PROPORCAO),
}

export async function subirCapa(blob: Blob): Promise<string> {
  const caminho = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('capas')
    .upload(caminho, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return caminho
}

export async function urlDaCapa(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from('capas').createSignedUrl(caminho, 60 * 60 * 8)
  return data?.signedUrl ?? null
}

/** Uma assinatura por caminho, numa chamada só — a lista pede várias de uma vez */
export async function urlsDasCapas(caminhos: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(caminhos)]
  if (unicos.length === 0) return new Map()
  const { data } = await supabase.storage.from('capas').createSignedUrls(unicos, 60 * 60 * 8)
  const map = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}

/** Vídeo de receita: aceita o link como veio e reconhece os do YouTube */
export function ehLinkValido(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
