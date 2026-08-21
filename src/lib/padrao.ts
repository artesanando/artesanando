import type { Receita } from '../types/database'

/* Carreiras de um granny salvo na biblioteca, do miolo para fora.
   Antes daqui saíam só duas cores — a primeira e a última —, e um granny de
   quatro carreiras perdia as duas do meio ao virar modelo do esquema. */
export function coresDoGranny(r: Receita): string[] | null {
  const rings = r.conteudo.rings
  if (!rings || rings.length === 0) return null
  return rings.map((a) => a.c)
}

/** Sequência de cores de um padrão de faixa salvo */
export function seqDaFaixa(r: Receita): string[] | null {
  const seq = r.conteudo.seq
  return seq && seq.length >= 2 ? seq : null
}
