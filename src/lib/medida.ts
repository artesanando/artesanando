/* Tamanho das mantas, em centímetros. A conta é sempre grade × peça: o granny
   se repete nos dois eixos, a faixa de tricô só empilha — a largura dela já é a
   largura da manta. */

export interface Medida {
  largura: number
  altura: number
}

export type TipoManta = 'manta_croche' | 'manta_trico'

/** Tamanho final da manta; null quando a peça ainda não tem medida cadastrada */
export function tamanhoManta(
  tipo: TipoManta,
  colunas: number,
  linhas: number,
  peca: { largura?: number | null; altura?: number | null } | null,
): Medida | null {
  if (!peca?.largura || !peca.altura) return null
  return tipo === 'manta_croche'
    ? { largura: colunas * peca.largura, altura: linhas * peca.altura }
    : { largura: peca.largura, altura: linhas * peca.altura }
}

/**
 * Grade que chega mais perto do tamanho pedido — para cima ou para baixo, o que
 * ficar menos distante. Quem chama mostra o resultado antes de aplicar, porque
 * o número quase nunca fecha redondo.
 */
export function gradeParaTamanho(
  tipo: TipoManta,
  alvo: Medida,
  peca: Medida,
): { colunas: number; linhas: number } {
  const linhas = Math.max(1, Math.round(alvo.altura / peca.altura))
  // no tricô a largura vem da faixa, então só a altura tem grade
  const colunas = tipo === 'manta_croche' ? Math.max(1, Math.round(alvo.largura / peca.largura)) : 1
  return { colunas, linhas }
}

const nn = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',').replace(',0', '')

export function fmtMedida(m: Medida | null): string {
  return m ? `${nn(m.largura)} × ${nn(m.altura)} cm` : '—'
}
