import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  FAIXA_SEQ_INICIAL,
  GRANNY_RINGS_INICIAL,
  MT_ROWS_INICIAL,
  PALETTE,
  type ModelKey,
} from '../mocks/data'
import { useAuth } from './auth'

/* Estado global de UI portado do protótipo (objeto S de js/app.js).
   Estado que só uma tela usa ficou local na própria tela. */

export type ModalKind =
  | 'projeto'
  | 'financeiro'
  | 'material'
  | 'receita'
  | 'emprestimo'
  | 'devolucao'
  | 'producao'
  | 'integrante'
  | 'encontro'
  | 'granny'
  | 'faixa'
  | 'layout'
  | 'detalhe'

export interface Ring {
  c: string
  name: string
  n: number
}

interface StoreState {
  modal: ModalKind | null
  creatorReturn: ModalKind | null
  finKind: 'entrada' | 'saida'
  projCat: 'manta' | 'amig'
  projTec: 'croche' | 'trico'
  detKey: string | null
  grannyRings: Ring[]
  faixaSeq: string[]
  faixaCount: number
  layoutCols: number
  layoutRows: number
  layoutBrush: ModelKey
  layoutMap: Record<string, ModelKey>
  mantaTRows: string[][]
}

const INITIAL: StoreState = {
  modal: null,
  creatorReturn: null,
  finKind: 'entrada',
  projCat: 'manta',
  projTec: 'croche',
  detKey: null,
  grannyRings: GRANNY_RINGS_INICIAL,
  faixaSeq: FAIXA_SEQ_INICIAL,
  faixaCount: 8,
  layoutCols: 8,
  layoutRows: 6,
  layoutBrush: 'A',
  layoutMap: {},
  mantaTRows: MT_ROWS_INICIAL,
}

export interface Store extends StoreState {
  isAdmin: boolean
  open: (m: ModalKind) => void
  close: () => void
  setFinKind: (k: 'entrada' | 'saida') => void
  openFin: (k: 'entrada' | 'saida') => void
  openDetalhe: (name: string) => void
  setProjCat: (c: 'manta' | 'amig') => void
  setProjTec: (t: 'croche' | 'trico') => void
  openGranny: (ret: ModalKind | null) => void
  openFaixa: (ret: ModalKind | null) => void
  openLayout: (ret: ModalKind | null) => void
  backToProjeto: () => void
  grannyInc: (i: number) => void
  grannyDec: (i: number) => void
  grannyDel: (i: number) => void
  grannyAdd: () => void
  grannySetColor: (c: string, name: string) => void
  faixaCycle: (i: number) => void
  faixaAdd: () => void
  faixaDrop: () => void
  incFaixa: () => void
  decFaixa: () => void
  layoutPaint: (r: number, c: number) => void
  pickBrush: (k: ModelKey) => void
  incCols: () => void
  decCols: () => void
  incRows: () => void
  decRows: () => void
  moveCell: (band: number, from: number, to: number) => void
  shuffleBand: (band: number) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  const [s, setS] = useState(INITIAL)
  const set = (patch: Partial<StoreState>) => setS((prev) => ({ ...prev, ...patch }))

  const store: Store = {
    ...s,
    isAdmin,
    open: (modal) => set({ modal }),
    close: () => set({ modal: null }),
    setFinKind: (finKind) => set({ finKind }),
    openFin: (finKind) => set({ modal: 'financeiro', finKind }),
    openDetalhe: (detKey) => set({ modal: 'detalhe', detKey }),
    setProjCat: (projCat) => set({ projCat }),
    setProjTec: (projTec) => set({ projTec }),
    openGranny: (creatorReturn) => set({ modal: 'granny', creatorReturn }),
    openFaixa: (creatorReturn) => set({ modal: 'faixa', creatorReturn }),
    openLayout: (creatorReturn) => set({ modal: 'layout', creatorReturn }),
    backToProjeto: () => set({ modal: s.creatorReturn }),
    grannyInc: (i) =>
      set({ grannyRings: s.grannyRings.map((x, j) => (j === i ? { ...x, n: x.n + 1 } : x)) }),
    grannyDec: (i) =>
      set({
        grannyRings: s.grannyRings.map((x, j) =>
          j === i ? { ...x, n: Math.max(1, x.n - 1) } : x,
        ),
      }),
    grannyDel: (i) =>
      set({
        grannyRings:
          s.grannyRings.length > 1 ? s.grannyRings.filter((_, j) => j !== i) : s.grannyRings,
      }),
    grannyAdd: () => {
      const used = s.grannyRings.map((r) => r.c)
      const pick = PALETTE.find((p) => !used.includes(p[0])) || PALETTE[0]
      set({ grannyRings: [...s.grannyRings, { c: pick[0], name: pick[1], n: 2 }] })
    },
    grannySetColor: (c, name) => {
      const last = s.grannyRings.length - 1
      set({ grannyRings: s.grannyRings.map((x, j) => (j === last ? { ...x, c, name } : x)) })
    },
    faixaCycle: (i) => {
      const pal = PALETTE.map((p) => p[0])
      const nx = pal[(pal.indexOf(s.faixaSeq[i]) + 1) % pal.length]
      set({ faixaSeq: s.faixaSeq.map((x, j) => (j === i ? nx : x)) })
    },
    faixaAdd: () => set({ faixaSeq: [...s.faixaSeq, PALETTE[s.faixaSeq.length % PALETTE.length][0]] }),
    faixaDrop: () => set({ faixaSeq: s.faixaSeq.length > 2 ? s.faixaSeq.slice(0, -1) : s.faixaSeq }),
    incFaixa: () => set({ faixaCount: Math.min(20, s.faixaCount + 1) }),
    decFaixa: () => set({ faixaCount: Math.max(2, s.faixaCount - 1) }),
    layoutPaint: (r, c) => set({ layoutMap: { ...s.layoutMap, [r + '-' + c]: s.layoutBrush } }),
    pickBrush: (layoutBrush) => set({ layoutBrush }),
    incCols: () => set({ layoutCols: Math.min(12, s.layoutCols + 1) }),
    decCols: () => set({ layoutCols: Math.max(3, s.layoutCols - 1) }),
    incRows: () => set({ layoutRows: Math.min(12, s.layoutRows + 1) }),
    decRows: () => set({ layoutRows: Math.max(3, s.layoutRows - 1) }),
    moveCell: (band, from, to) => {
      const rows = s.mantaTRows.map((r) => r.slice())
      const row = rows[band]
      if (to < 0 || to >= row.length) return
      const [x] = row.splice(from, 1)
      row.splice(to, 0, x)
      set({ mantaTRows: rows })
    },
    shuffleBand: (band) => {
      const rows = s.mantaTRows.map((r) => r.slice())
      const a = rows[band]
      for (let k = a.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1))
        ;[a[k], a[j]] = [a[j], a[k]]
      }
      set({ mantaTRows: rows })
    },
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}
