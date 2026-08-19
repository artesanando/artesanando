/* Recorte de imagem para upload. A moldura vem em fração do tamanho exibido da
   foto (0…1), o que deixa a conta independente da escala em que ela apareceu na
   tela — e do dispositivo. */

export interface Moldura {
  /** canto superior esquerdo, em fração da largura/altura da imagem */
  x: number
  y: number
  /** tamanho, em fração da largura/altura da imagem */
  w: number
  h: number
}

/**
 * Corta o pedaço que a moldura marcou e devolve um JPEG do tamanho pedido.
 * Sem isso, uma foto de 5 MB do celular iria inteira para o Storage só para
 * virar um círculo de 32 px na sidebar.
 */
export function recortar(
  img: HTMLImageElement,
  moldura: Moldura,
  largura: number,
  altura: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')!

  const sx = moldura.x * img.naturalWidth
  const sy = moldura.y * img.naturalHeight
  const sw = moldura.w * img.naturalWidth
  const sh = moldura.h * img.naturalHeight

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, largura, altura)

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('não foi possível gerar a imagem'))),
      'image/jpeg',
      0.85,
    ),
  )
}

/** Moldura inicial: a maior que cabe na foto respeitando a proporção pedida */
export function molduraInicial(largura: number, altura: number, proporcao: number): Moldura {
  const daFoto = largura / altura
  // proporção em fração: o lado limitante é 1, o outro encolhe
  const w = daFoto > proporcao ? proporcao / daFoto : 1
  const h = daFoto > proporcao ? 1 : daFoto / proporcao
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}

/** Mantém a moldura dentro da foto sem deixá-la menor que o mínimo */
export function encaixa(m: Moldura, min = 0.08): Moldura {
  const w = Math.min(1, Math.max(min, m.w))
  const h = Math.min(1, Math.max(min, m.h))
  return {
    w,
    h,
    x: Math.min(1 - w, Math.max(0, m.x)),
    y: Math.min(1 - h, Math.max(0, m.y)),
  }
}
