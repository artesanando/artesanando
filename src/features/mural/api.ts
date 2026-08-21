import { supabase } from '../../lib/supabase'

export interface Album {
  id: string
  nome: string
  criado_por: string | null
  created_at: string
}

export interface Foto {
  id: string
  path: string
  album_id: string | null
  autor_id: string | null
  created_at: string
  autor?: { nome: string } | null
}

export async function fetchAlbuns(): Promise<Album[]> {
  const { data, error } = await supabase.from('mural_albuns').select('*').order('nome')
  if (error) throw error
  return (data ?? []) as Album[]
}

export async function fetchFotos(): Promise<Foto[]> {
  const { data, error } = await supabase
    .from('mural_fotos')
    .select('*, autor:profiles!autor_id(nome)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Foto[]
}

export async function criarAlbum(nome: string, criadoPor: string) {
  const { error } = await supabase
    .from('mural_albuns')
    .insert({ nome: nome.trim(), criado_por: criadoPor })
  if (error) throw error
}

export async function renomearAlbum(id: string, nome: string) {
  const { error } = await supabase.from('mural_albuns').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw error
}

/* Apagar o álbum não apaga as fotos: o `on delete set null` da coluna devolve
   todas elas para as soltas. */
export async function apagarAlbum(id: string) {
  const { error } = await supabase.from('mural_albuns').delete().eq('id', id)
  if (error) throw error
}

export async function moverFoto(id: string, albumId: string | null) {
  const { error } = await supabase.from('mural_fotos').update({ album_id: albumId }).eq('id', id)
  if (error) throw error
}

export async function apagarFoto(foto: Foto) {
  const { error } = await supabase.from('mural_fotos').delete().eq('id', foto.id)
  if (error) throw error
  await supabase.storage.from('mural').remove([foto.path])
}

/* Sobe as fotos como vieram, sem recorte: quem fotografa o encontro quer jogar
   tudo lá de uma vez, não enquadrar uma a uma. */
export async function subirFotos(
  arquivos: File[],
  autorId: string,
  albumId: string | null,
): Promise<number> {
  let subidas = 0
  for (const arquivo of arquivos) {
    const ext = arquivo.name.split('.').pop()?.toLowerCase() || 'jpg'
    const caminho = `${crypto.randomUUID()}.${ext}`
    const up = await supabase.storage
      .from('mural')
      .upload(caminho, arquivo, { contentType: arquivo.type || 'image/jpeg' })
    if (up.error) continue
    const { error } = await supabase
      .from('mural_fotos')
      .insert({ path: caminho, autor_id: autorId, album_id: albumId })
    if (!error) subidas += 1
  }
  return subidas
}

export async function urlsDasFotos(caminhos: string[]): Promise<Map<string, string>> {
  if (caminhos.length === 0) return new Map()
  const { data } = await supabase.storage.from('mural').createSignedUrls(caminhos, 60 * 60 * 8)
  const mapa = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl)
  }
  return mapa
}

/* ---------- Derivados (unit-testados) ---------- */

/** Fotos do álbum escolhido; `null` mostra tudo, inclusive as soltas */
export function fotosDoAlbum(fotos: Foto[], albumId: string | null): Foto[] {
  return albumId === null ? fotos : fotos.filter((f) => f.album_id === albumId)
}

export function contaPorAlbum(fotos: Foto[]): Map<string, number> {
  const mapa = new Map<string, number>()
  for (const f of fotos) {
    if (f.album_id) mapa.set(f.album_id, (mapa.get(f.album_id) ?? 0) + 1)
  }
  return mapa
}

/** Quantas ainda não foram arrumadas em álbum nenhum */
export const soltas = (fotos: Foto[]) => fotos.filter((f) => !f.album_id).length
