import { supabase } from '../../lib/supabase'
import type { Preferencia } from '../../types/database'

export async function atualizarPerfil(
  id: string,
  dados: {
    nome?: string
    telefone?: string | null
    preferencia?: Preferencia
    avatar_color?: string
    avatar_url?: string | null
  },
) {
  const { error } = await supabase.from('profiles').update(dados).eq('id', id)
  if (error) throw error
}

/* A foto vai para o bucket `avatares` numa pasta com o id do perfil — é isso que
   a policy usa para deixar cada uma mexer só na própria. */
export async function subirAvatar(perfilId: string, arquivo: Blob): Promise<string> {
  const caminho = `${perfilId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('avatares')
    .upload(caminho, arquivo, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return caminho
}

export async function urlDoAvatar(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from('avatares').createSignedUrl(caminho, 60 * 60 * 8)
  return data?.signedUrl ?? null
}

export async function apagarAvatar(caminho: string) {
  await supabase.storage.from('avatares').remove([caminho])
}

/**
 * Recorta a imagem num quadrado centrado no que a pessoa enquadrou e devolve
 * um JPEG de 256×256. Sem isso, uma foto de 5 MB do celular iria inteira para o
 * Storage só para virar um círculo de 32 px na sidebar.
 */
export function recortarQuadrado(
  img: HTMLImageElement,
  opts: { zoom: number; offsetX: number; offsetY: number; lado?: number },
): Promise<Blob> {
  const lado = opts.lado ?? 256
  const canvas = document.createElement('canvas')
  canvas.width = lado
  canvas.height = lado
  const ctx = canvas.getContext('2d')!

  // o menor lado da imagem preenche o recorte no zoom 1
  const base = Math.min(img.naturalWidth, img.naturalHeight)
  const visivel = base / opts.zoom
  const cx = img.naturalWidth / 2 - opts.offsetX * visivel
  const cy = img.naturalHeight / 2 - opts.offsetY * visivel

  ctx.drawImage(
    img,
    cx - visivel / 2,
    cy - visivel / 2,
    visivel,
    visivel,
    0,
    0,
    lado,
    lado,
  )

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('não foi possível gerar a imagem'))),
      'image/jpeg',
      0.85,
    ),
  )
}
