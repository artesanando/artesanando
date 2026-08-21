/* Geometria da grade da manta. Fica fora de `features/` porque o mapa do
   projeto e o editor de esquema da biblioteca usam a mesma conta. */

/** Linha/coluna (1-based) de uma posição na grade */
export function coordenada(posicao: number, colunas: number) {
  return { linha: Math.floor(posicao / colunas) + 1, coluna: (posicao % colunas) + 1 }
}

/** Posições dentro do retângulo entre dois cantos — seleção por arrasto */
export function retangulo(de: number, ate: number, colunas: number): number[] {
  const a = coordenada(de, colunas)
  const b = coordenada(ate, colunas)
  const l1 = Math.min(a.linha, b.linha)
  const l2 = Math.max(a.linha, b.linha)
  const c1 = Math.min(a.coluna, b.coluna)
  const c2 = Math.max(a.coluna, b.coluna)
  const out: number[] = []
  for (let l = l1; l <= l2; l++) for (let c = c1; c <= c2; c++) out.push((l - 1) * colunas + (c - 1))
  return out
}

/* Distribuição diagonal dos modelos: a letra avança uma posição a cada coluna e
   a cada linha, então a mesma cor sobe numa diagonal contínua — que é o sentido
   em que a manta cresce. */
export function gradePadrao(colunas: number, linhas: number, letras: string[]): string[][] {
  return Array.from({ length: linhas }, (_, l) =>
    Array.from({ length: colunas }, (_, c) => letras[(l + c) % letras.length]),
  )
}

/* Cores de uma faixa de tricô: a mesma sequência, rodada uma posição por faixa.
   Antes todas as faixas nasciam idênticas e a manta saía listrada em blocos
   retos; deslocando, as cores caminham na diagonal ao longo da manta. */
export function sequenciaDaFaixa(seq: string[], indice: number): string[] {
  if (seq.length === 0) return seq
  return seq.map((_, j) => seq[(j + indice) % seq.length])
}

/* Cores de cada faixa da manta: as que foram editadas uma a uma, quando
   houver, e o resto seguindo o deslocamento da faixa modelo. */
export function faixasDaManta(seq: string[], faixas: number, livres?: string[][]): string[][] {
  return Array.from({ length: faixas }, (_, i) => livres?.[i] ?? sequenciaDaFaixa(seq, i))
}

/** Redimensiona uma grade de letras preservando o que couber e completando o resto */
export function redimensionaCelulas(
  celulas: string[][],
  colunas: number,
  linhas: number,
  letras: string[],
): string[][] {
  const padrao = gradePadrao(colunas, linhas, letras)
  return padrao.map((linha, l) =>
    linha.map((letra, c) => {
      const atual = celulas[l]?.[c]
      return atual && letras.includes(atual) ? atual : letra
    }),
  )
}
