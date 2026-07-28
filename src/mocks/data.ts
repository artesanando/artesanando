/* Dados mockados restantes do protótipo (js/app.js).
   O que sobra aqui é removido no M5, quando o dashboard/presença/etc.
   passarem a derivar tudo do banco. */

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

export interface ModelDef {
  nome: string
  border: string
  inner: string
  resp: string
}

export const MODELS: Record<ModelKey, ModelDef> = {
  A: { nome: 'Modelo A — Flor de Maio', border: '#C4798A', inner: '#DFA2AC', resp: 'Ana Luiza' },
  B: { nome: 'Modelo B — Sunburst', border: '#B99BC4', inner: '#E3C07A', resp: 'Beatriz' },
  C: { nome: 'Modelo C — Clássico', border: '#7D9B76', inner: '#A9BFA3', resp: 'Fernanda' },
}

export const CHAMADA: [string, string, 0 | 1][] = [
  ['Ana Luiza Prado', '#C4798A', 1],
  ['Beatriz Gomes', '#7D9B76', 1],
  ['Camila Rocha', '#C9B98F', 0],
  ['Duda Ferreira', '#8FA3B8', 1],
  ['Elisa Martins', '#B99BC4', 1],
  ['Fernanda Dias', '#C9B98F', 1],
]

export const GRANNY_RINGS_INICIAL = [
  { c: '#DFA2AC', name: 'Rosé', n: 5 },
  { c: '#E3C07A', name: 'Amarelo', n: 3 },
  { c: '#7D9B76', name: 'Sálvia', n: 4 },
]

export const FAIXA_SEQ_INICIAL = ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C']
