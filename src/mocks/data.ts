/* Dados mockados portados do protótipo (js/app.js).
   Serão substituídos por dados reais do Supabase nos milestones M1–M5. */

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

export interface MapSquare {
  i: number
  m: ModelKey
  border: string
  inner: string
  done: boolean
}

export function buildMapa(): MapSquare[] {
  const plan = 'A'.repeat(40) + 'B'.repeat(24) + 'C'.repeat(16)
  // embaralho determinístico para o mapa não ficar em blocos
  const order = plan
    .split('')
    .map((m, i) => ({ m: m as ModelKey, k: (i * 37) % 80 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.m)
  const doneByModel: Record<ModelKey, number> = { A: 32, B: 15, C: 16 }
  const seen: Record<ModelKey, number> = { A: 0, B: 0, C: 0 }
  return order.map((m, i) => {
    seen[m]++
    const md = MODELS[m]
    return { i, m, border: md.border, inner: md.inner, done: seen[m] <= doneByModel[m] }
  })
}

export type EstoTabKey = 'novelos' | 'agulhas' | 'olhos' | 'enchimento' | 'feira'

export interface EstoqueRow {
  a: string
  dot: string | null
  det: string
  disp: string
  dTone: 'ok' | 'low'
  empr: string
}

export interface EstoqueTab {
  cols: string[]
  unit: string
  rows: EstoqueRow[]
}

export const ESTOQUE: Record<EstoTabKey, EstoqueTab> = {
  novelos: {
    cols: ['MARCA / LINHA', 'COR', 'DISP.', 'EMPR.'],
    unit: 'novelos',
    rows: [
      { a: 'Círculo Balloon', dot: '#DFA2AC', det: 'rosé', disp: '18', dTone: 'ok', empr: '2' },
      { a: 'Círculo Balloon', dot: '#A9BFA3', det: 'sálvia', disp: '22', dTone: 'ok', empr: '—' },
      { a: 'Amigurumi Soft', dot: '#8B6A4F', det: 'marrom', disp: '9', dTone: 'ok', empr: '—' },
      { a: 'Mollet', dot: '#F3D9A4', det: 'amarelo bebê', disp: '2 ⚠', dTone: 'low', empr: '3' },
      { a: 'Anne', dot: '#B99BC4', det: 'lilás', disp: '14', dTone: 'ok', empr: '—' },
    ],
  },
  agulhas: {
    cols: ['TIPO', 'MEDIDA', 'DISP.', 'EMPR.'],
    unit: 'agulhas e ganchos',
    rows: [
      { a: 'Agulha de crochê', dot: null, det: '3,0 mm', disp: '8', dTone: 'ok', empr: '3' },
      { a: 'Agulha de crochê', dot: null, det: '4,0 mm', disp: '6', dTone: 'ok', empr: '5' },
      { a: 'Agulha de tricô (par)', dot: null, det: '4,5 mm', disp: '4', dTone: 'ok', empr: '2' },
      { a: 'Agulha de tricô (par)', dot: null, det: '5,0 mm', disp: '1 ⚠', dTone: 'low', empr: '1' },
      { a: 'Agulha circular', dot: null, det: '60 cm · 4 mm', disp: '3', dTone: 'ok', empr: '—' },
    ],
  },
  olhos: {
    cols: ['ITEM', 'TAMANHO', 'DISP.', 'EMPR.'],
    unit: 'olhos e itens de segurança',
    rows: [
      { a: 'Olho de segurança', dot: null, det: '9 mm · preto', disp: '40', dTone: 'ok', empr: '—' },
      { a: 'Olho de segurança', dot: null, det: '12 mm · preto', disp: '12', dTone: 'ok', empr: '—' },
      { a: 'Nariz de segurança', dot: null, det: '15 mm · marrom', disp: '8', dTone: 'ok', empr: '—' },
      { a: 'Trava de segurança', dot: null, det: 'par', disp: '3 ⚠', dTone: 'low', empr: '—' },
    ],
  },
  enchimento: {
    cols: ['ITEM', 'ESPECIFICAÇÃO', 'DISP.', 'EMPR.'],
    unit: 'enchimento',
    rows: [
      { a: 'Fibra siliconada', dot: null, det: 'pacote 400 g', disp: '6', dTone: 'ok', empr: '—' },
      { a: 'Fibra siliconada', dot: null, det: 'granel · kg', disp: '2', dTone: 'ok', empr: '—' },
      { a: 'Manta acrílica', dot: null, det: 'metro', disp: '1 ⚠', dTone: 'low', empr: '—' },
    ],
  },
  feira: {
    cols: ['ITEM', 'DETALHE', 'DISP.', 'VENDIDOS'],
    unit: 'itens de feira',
    rows: [
      { a: 'Touca de crochê', dot: null, det: 'bazar', disp: '10', dTone: 'ok', empr: '6' },
      { a: 'Chaveiro coração', dot: null, det: 'bazar', disp: '18', dTone: 'ok', empr: '12' },
      { a: 'Marca-página', dot: null, det: 'bazar', disp: '24', dTone: 'ok', empr: '9' },
      { a: 'Sousplat crochê', dot: null, det: 'bazar', disp: '5', dTone: 'ok', empr: '3' },
    ],
  },
}

export const ESTO_TABS: [EstoTabKey, string][] = [
  ['novelos', 'Novelos'],
  ['agulhas', 'Agulhas'],
  ['olhos', 'Olhos & segurança'],
  ['enchimento', 'Enchimento'],
  ['feira', 'Itens de feira'],
]

export type BibCatKey = 'amigurumi' | 'granny' | 'faixa' | 'manta'

export const BIB_CAT: Record<BibCatKey, { lbl: string; fg: string; chip: string; accent: string }> =
  {
    amigurumi: { lbl: 'Amigurumi', fg: '#A05666', chip: '#F6E4E6', accent: '#C4798A' },
    granny: { lbl: 'Granny square', fg: '#55704E', chip: '#EAF0E6', accent: '#7D9B76' },
    faixa: { lbl: 'Faixa de tricô', fg: '#9A7328', chip: '#F1EAE0', accent: '#C9B98F' },
    manta: { lbl: 'Esquema de manta', fg: '#5E7286', chip: '#E7EDF2', accent: '#8FA3B8' },
  }

export const BIB_ITEMS: [string, BibCatKey, string, string][] = [
  ['Capivara da Lú', 'amigurumi', 'fio 4 mm', '3 pág'],
  ['Granny Flor de Maio', 'granny', '4 carreiras', '2 pág'],
  ['Faixa Ponto Arroz', 'faixa', 'agulha 5 mm', '1 pág'],
  ['Polvinho p/ prematuros', 'amigurumi', 'uso hospitalar', '4 pág'],
  ['Granny Sunburst', 'granny', '5 carreiras', '2 pág'],
  ['Manta Nuvem — esquema', 'manta', '8 faixas', '5 pág'],
  ['Coelha Nina', 'amigurumi', 'fio 3 mm', '3 pág'],
]

export interface DetRing {
  c: string
  name: string
  n: number
  role: string
}

export interface Detalhe {
  kind: 'faixa' | 'manta' | 'granny'
  tag: string
  tBg: string
  tC: string
  sub: string
  resumo: string
  specs: [string, string][]
  seq?: string[]
  materiais?: { c: string; name: string; qty: string }[]
  paleta?: { c: string; name: string }[]
  montagem?: string[]
  rings?: DetRing[]
}

export const DET: Record<string, Detalhe> = {
  'Faixa Ponto Arroz': {
    kind: 'faixa',
    tag: 'FAIXA DE TRICÔ',
    tBg: '#F1EAE0',
    tC: '#9A7328',
    sub: 'faixa de tricô · 5 mm',
    resumo:
      'Faixa base da Manta Nuvem — uma linha inteira em ponto arroz, trocando as cores na sequência combinada.',
    specs: [
      ['Ponto', 'Arroz'],
      ['Agulha', '5 mm'],
      ['Largura', '40 pts'],
      ['Comprimento', '~1,10 m'],
    ],
    seq: ['#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC'],
    materiais: [
      { c: '#ECD97C', name: 'Manteiga', qty: '2 novelos' },
      { c: '#A9BFA3', name: 'Verde', qty: '2 novelos' },
      { c: '#DFA2AC', name: 'Rosé', qty: '1 novelo' },
    ],
  },
  'Manta Nuvem — esquema': {
    kind: 'manta',
    tag: 'MANTA DE TRICÔ',
    tBg: '#F1EAE0',
    tC: '#9A7328',
    sub: 'manta de tricô · 8 faixas',
    resumo:
      '8 faixas em ponto arroz, cada uma feita por uma integrante. Todas usam a mesma paleta — só muda a ordem das cores.',
    specs: [
      ['Faixas', '8'],
      ['Ponto', 'Arroz'],
      ['Agulha', '5 mm'],
      ['Tamanho', '0,90×1,10 m'],
    ],
    paleta: [
      { c: '#ECD97C', name: 'Manteiga' },
      { c: '#A9BFA3', name: 'Verde' },
      { c: '#DFA2AC', name: 'Rosé' },
    ],
    montagem: [
      'Cada integrante tricota 1 faixa inteira.',
      'Confira a ordem de cores de cada faixa no esquema.',
      'Una as faixas com costura invisível (ponto colchão).',
      'Faça a barra de acabamento em ponto baixo ao redor.',
    ],
  },
  'Granny Flor de Maio': {
    kind: 'granny',
    tag: 'GRANNY SQUARE',
    tBg: '#EAF0E6',
    tC: '#55704E',
    sub: 'granny square · Primavera',
    resumo:
      'Granny quadrado de 4 carreiras — miolo claro abrindo para a borda em sálvia. Base dos quadrados da Manta Primavera.',
    specs: [
      ['Carreiras', '4'],
      ['Agulha', '4 mm'],
      ['Ponto', 'P. alto'],
      ['Tamanho', '12×12 cm'],
    ],
    rings: [
      { c: '#E3C07A', name: 'Amarelo', n: 1, role: 'miolo' },
      { c: '#DFA2AC', name: 'Rosé', n: 2, role: 'meio' },
      { c: '#7D9B76', name: 'Sálvia', n: 1, role: 'borda' },
    ],
  },
  'Granny Sunburst': {
    kind: 'granny',
    tag: 'GRANNY SQUARE',
    tBg: '#EAF0E6',
    tC: '#55704E',
    sub: 'granny square · médio',
    resumo:
      'Granny com miolo em explosão de cor — carreiras concêntricas até o quadrado ficar médio.',
    specs: [
      ['Carreiras', '5'],
      ['Agulha', '4 mm'],
      ['Ponto', 'P. alto'],
      ['Tamanho', '14×14 cm'],
    ],
    rings: [
      { c: '#DFA2AC', name: 'Rosé', n: 1, role: 'miolo' },
      { c: '#E3C07A', name: 'Amarelo', n: 2, role: 'meio' },
      { c: '#7D9B76', name: 'Sálvia', n: 2, role: 'borda' },
    ],
  },
}

export const CHAMADA: [string, string, 0 | 1][] = [
  ['Ana Luiza Prado', '#C4798A', 1],
  ['Beatriz Gomes', '#7D9B76', 1],
  ['Camila Rocha', '#C9B98F', 0],
  ['Duda Ferreira', '#8FA3B8', 1],
  ['Elisa Martins', '#B99BC4', 1],
  ['Fernanda Dias', '#C9B98F', 1],
]

export const MT_RESP = [
  'Giulia',
  'Camila',
  'Camila',
  'Ana Luiza',
  'Ana Luiza',
  'Elisa',
  'Ana Luiza',
  'Giulia',
]
export const MT_ACOL = [
  '#C4798A',
  '#C9B98F',
  '#C9B98F',
  '#8FA3B8',
  '#8FA3B8',
  '#B99BC4',
  '#8FA3B8',
  '#C4798A',
]
export const MT_STATUS: ('feita' | 'fazendo' | 'afazer')[] = [
  'feita',
  'feita',
  'feita',
  'fazendo',
  'afazer',
  'afazer',
  'afazer',
  'afazer',
]
export const MT_NOMES: Record<string, string> = {
  '#ECD97C': 'Manteiga',
  '#A9BFA3': 'Verde',
  '#DFA2AC': 'Rosé',
}

export const MT_ROWS_INICIAL: string[][] = [
  ['#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC'],
  ['#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC'],
  ['#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C'],
  ['#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3'],
  ['#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C'],
  ['#DFA2AC', '#ECD97C', '#A9BFA3', '#DFA2AC', '#ECD97C', '#A9BFA3'],
  ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#DFA2AC'],
  ['#A9BFA3', '#DFA2AC', '#ECD97C', '#DFA2AC', '#ECD97C', '#A9BFA3'],
]

export interface PermRow {
  ini: string
  nome: string
  cor: string
  flags: [number, number, number, number]
}

export const PERMS_INICIAL: PermRow[] = [
  { ini: 'AL', nome: 'Ana Luiza', cor: '#C4798A', flags: [1, 1, 1, 0] },
  { ini: 'B', nome: 'Beatriz', cor: '#7D9B76', flags: [1, 0, 1, 0] },
  { ini: 'C', nome: 'Camila', cor: '#C9B98F', flags: [1, 0, 1, 0] },
  { ini: 'F', nome: 'Fernanda', cor: '#8FA3B8', flags: [1, 1, 1, 0] },
]

export const GRANNY_RINGS_INICIAL = [
  { c: '#DFA2AC', name: 'Rosé', n: 5 },
  { c: '#E3C07A', name: 'Amarelo', n: 3 },
  { c: '#7D9B76', name: 'Sálvia', n: 4 },
]

export const FAIXA_SEQ_INICIAL = ['#ECD97C', '#A9BFA3', '#ECD97C', '#DFA2AC', '#A9BFA3', '#ECD97C']
