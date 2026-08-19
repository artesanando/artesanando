/* Paleta de fios e modelos padrão dos criadores de padrões */

export type ModelKey = 'A' | 'B' | 'C'

export const PALETTE: [string, string][] = [
  ['#DFA2AC', 'Rosé'],
  ['#E3C07A', 'Amarelo'],
  ['#7D9B76', 'Sálvia'],
  ['#A9BFA3', 'Verde'],
  ['#B99BC4', 'Lilás'],
  ['#ECD97C', 'Manteiga'],
  ['#8FA3B8', 'Azul'],
  ['#C4798A', 'Rosa'],
]

/** Nome da cor na paleta de fios; cor livre não tem nome próprio */
export const nomeDaCor = (hex: string) =>
  PALETTE.find(([c]) => c.toLowerCase() === hex.toLowerCase())?.[1] ?? 'Cor'

export interface ModelDef {
  nome: string
  border: string
  inner: string
}

export const MODELS: Record<ModelKey, ModelDef> = {
  A: { nome: 'Modelo A — Flor de Maio', border: '#C4798A', inner: '#DFA2AC' },
  B: { nome: 'Modelo B — Sunburst', border: '#B99BC4', inner: '#E3C07A' },
  C: { nome: 'Modelo C — Clássico', border: '#7D9B76', inner: '#A9BFA3' },
}

export const GRANNY_RINGS_INICIAL = [
  { c: '#DFA2AC', name: 'Rosé', n: 5 },
  { c: '#E3C07A', name: 'Amarelo', n: 3 },
  { c: '#7D9B76', name: 'Sálvia', n: 4 },
]

export const FAIXA_SEQ_INICIAL = ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C']
