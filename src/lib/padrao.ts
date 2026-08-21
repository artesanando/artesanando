import type { Receita } from '../types/database'

/* Cores de um padrão de granny salvo na biblioteca, na forma que o modelo do
   esquema usa. O anel de fora é a borda que se vê na manta montada; o primeiro
   é o miolo. Padrão de um anel só usa a mesma cor nos dois. */
export function coresDoGranny(r: Receita): { border: string; inner: string } | null {
  const rings = r.conteudo.rings
  if (!rings || rings.length === 0) return null
  return { inner: rings[0].c, border: rings[rings.length - 1].c }
}

/** Sequência de cores de um padrão de faixa salvo */
export function seqDaFaixa(r: Receita): string[] | null {
  const seq = r.conteudo.seq
  return seq && seq.length >= 2 ? seq : null
}
