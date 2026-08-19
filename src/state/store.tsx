import { createContext, useContext, useState, type ReactNode } from 'react'
import { FAIXA_SEQ_INICIAL, GRANNY_RINGS_INICIAL, nomeDaCor, PALETTE } from '../lib/paleta'
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
  | 'movimento-estoque'
  | 'ficha-projeto'
  | 'integrante'
  | 'encontro'
  | 'granny'
  | 'faixa'
  | 'layout'

export interface Ring {
  c: string
  name: string
  n: number
}

interface StoreState {
  modal: ModalKind | null
  creatorReturn: ModalKind | null
  devolucaoId: string | null
  projetoId: string | null
  /** item de estoque sendo editado ou movimentado */
  estoqueItemId: string | null
  /** encontro sendo editado; null = novo encontro */
  encontroId: string | null
  /** perfil sem conta sendo convidado; null = cadastro do zero */
  integranteId: string | null
  finKind: 'entrada' | 'saida'
  projCat: 'manta' | 'amig'
  projTec: 'croche' | 'trico'
  grannyRings: Ring[]
  faixaSeq: string[]
  faixaCount: number
}

const INITIAL: StoreState = {
  modal: null,
  creatorReturn: null,
  devolucaoId: null,
  projetoId: null,
  estoqueItemId: null,
  encontroId: null,
  integranteId: null,
  finKind: 'entrada',
  projCat: 'manta',
  projTec: 'croche',
  grannyRings: GRANNY_RINGS_INICIAL,
  faixaSeq: FAIXA_SEQ_INICIAL,
  faixaCount: 8,
}

export interface Store extends StoreState {
  isAdmin: boolean
  open: (m: ModalKind) => void
  close: () => void
  openDevolucao: (emprestimoId: string | null) => void
  /** abre o formulário de material; sem id, é cadastro novo */
  openMaterial: (itemId: string | null) => void
  openMovimentoEstoque: (itemId: string) => void
  openFichaProjeto: (projetoId: string) => void
  openEncontro: (encontroId: string | null) => void
  /** com id, convida o perfil sem conta que já existe; sem id, cadastra do zero */
  openIntegrante: (integranteId: string | null) => void
  setFinKind: (k: 'entrada' | 'saida') => void
  openFin: (k: 'entrada' | 'saida') => void
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
  grannySetColor: (i: number, c: string) => void
  faixaCycle: (i: number) => void
  faixaAdd: () => void
  faixaDrop: () => void
  incFaixa: () => void
  decFaixa: () => void
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
    close: () =>
      set({
        modal: null,
        devolucaoId: null,
        projetoId: null,
        estoqueItemId: null,
        encontroId: null,
        integranteId: null,
      }),
    openDevolucao: (devolucaoId) => set({ modal: 'devolucao', devolucaoId }),
    openMaterial: (estoqueItemId) => set({ modal: 'material', estoqueItemId }),
    openMovimentoEstoque: (estoqueItemId) => set({ modal: 'movimento-estoque', estoqueItemId }),
    openFichaProjeto: (projetoId) => set({ modal: 'ficha-projeto', projetoId }),
    openEncontro: (encontroId) => set({ modal: 'encontro', encontroId }),
    openIntegrante: (integranteId) => set({ modal: 'integrante', integranteId }),
    setFinKind: (finKind) => set({ finKind }),
    openFin: (finKind) => set({ modal: 'financeiro', finKind }),
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
    grannySetColor: (i, c) =>
      set({
        grannyRings: s.grannyRings.map((x, j) => (j === i ? { ...x, c, name: nomeDaCor(c) } : x)),
      }),
    faixaCycle: (i) => {
      const pal = PALETTE.map((p) => p[0])
      const nx = pal[(pal.indexOf(s.faixaSeq[i]) + 1) % pal.length]
      set({ faixaSeq: s.faixaSeq.map((x, j) => (j === i ? nx : x)) })
    },
    faixaAdd: () => set({ faixaSeq: [...s.faixaSeq, PALETTE[s.faixaSeq.length % PALETTE.length][0]] }),
    faixaDrop: () => set({ faixaSeq: s.faixaSeq.length > 2 ? s.faixaSeq.slice(0, -1) : s.faixaSeq }),
    incFaixa: () => set({ faixaCount: Math.min(20, s.faixaCount + 1) }),
    decFaixa: () => set({ faixaCount: Math.max(2, s.faixaCount - 1) }),
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore fora do StoreProvider')
  return ctx
}
