import type { CSSProperties } from 'react'

/* Desenho de um granny square: anéis concêntricos, do miolo para fora.
 *
 * Antes esse desenho estava copiado em quatro lugares (editor de esquema,
 * pincel, prévia da grade e mapa do projeto), e todos sabiam desenhar só duas
 * cores — borda e miolo. Um granny de quatro carreiras perdia as duas do meio
 * ao virar modelo, e ninguém percebia porque a biblioteca mostrava certo.
 *
 * Com duas cores desenha exatamente o que se via antes, então tudo que já
 * existe continua igual sem precisar de migração de dados.
 */
export function SquareGranny({
  cores,
  tamanho,
  radius = 2,
  style,
}: {
  /** do miolo para fora; duas cores reproduzem o desenho antigo */
  cores: string[]
  tamanho: number
  radius?: number
  style?: CSSProperties
}) {
  const n = Math.max(1, cores.length)
  // o de fora ocupa tudo; cada anel para dentro encolhe uma fatia igual
  const aneis = cores.map((c, i) => ({ c, sz: Math.round(tamanho * (1 - (n - 1 - i) / n)) })).reverse()

  return (
    <span
      style={{
        width: tamanho,
        height: tamanho,
        position: 'relative',
        display: 'block',
        borderRadius: radius,
        overflow: 'hidden',
        background: cores[cores.length - 1] ?? '#ccc',
        ...style,
      }}
    >
      {aneis.map((a, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: a.sz,
            height: a.sz,
            background: a.c,
          }}
        />
      ))}
    </span>
  )
}

/** Cores de um modelo, com as duas antigas como fallback de tudo que já existe */
export const coresDoModelo = (m: {
  cores?: string[] | null
  cor_borda: string
  cor_miolo: string
}): string[] => (m.cores && m.cores.length > 0 ? m.cores : [m.cor_miolo, m.cor_borda])
