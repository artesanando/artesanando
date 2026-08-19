import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

/* Casca de todo pop-up do app. Os controles nativos (select, date, time, color,
   confirm) abrem janelas do sistema operacional, que mudam de cara em cada
   navegador e ignoram a paleta do Artesanando — aqui eles são substituídos por
   painéis nossos, todos com o mesmo comportamento: Esc fecha, clique fora fecha,
   foco preso enquanto aberto, entrada e saída animadas. */

/** Mantém o nó montado durante a animação de saída. */
export function useMontagemAnimada(aberto: boolean, ms = 200) {
  const [montado, setMontado] = useState(aberto)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    if (aberto) {
      setMontado(true)
      setSaindo(false)
      return
    }
    if (!montado) return
    setSaindo(true)
    const t = setTimeout(() => {
      setMontado(false)
      setSaindo(false)
    }, ms)
    return () => clearTimeout(t)
  }, [aberto, montado, ms])

  return { montado, saindo }
}

/** Prende o Tab dentro do container enquanto ele estiver aberto. */
export function usePrendeFoco(ref: RefObject<HTMLElement | null>, ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const anterior = document.activeElement as HTMLElement | null
    const alvo = ref.current
    if (!alvo) return

    const focaveis = () =>
      [
        ...alvo.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement)

    focaveis()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const lista = focaveis()
      if (lista.length === 0) return
      const primeiro = lista[0]
      const ultimo = lista[lista.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      anterior?.focus?.()
    }
  }, [ref, ativo])
}

interface PopoverProps {
  aberto: boolean
  aoFechar: () => void
  ancora: HTMLElement | null
  children: ReactNode
  /** largura fixa; por padrão acompanha a do gatilho */
  largura?: number
  alinhamento?: 'inicio' | 'fim'
  ariaLabel?: string
}

export function Popover({
  aberto,
  aoFechar,
  ancora,
  children,
  largura,
  alinhamento = 'inicio',
  ariaLabel,
}: PopoverProps) {
  const painel = useRef<HTMLDivElement>(null)
  const { montado, saindo } = useMontagemAnimada(aberto)
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 })

  usePrendeFoco(painel, montado && !saindo)

  useLayoutEffect(() => {
    if (!montado || !ancora) return
    const posicionar = () => {
      const r = ancora.getBoundingClientRect()
      const w = largura ?? r.width
      const alturaEstimada = painel.current?.offsetHeight ?? 240
      // abre para cima quando não cabe embaixo
      const abaixo = window.innerHeight - r.bottom > alturaEstimada + 12
      setPos({
        top: abaixo ? r.bottom + 6 : Math.max(8, r.top - alturaEstimada - 6),
        left: Math.min(
          Math.max(8, alinhamento === 'fim' ? r.right - w : r.left),
          Math.max(8, window.innerWidth - w - 8),
        ),
        minWidth: w,
      })
    }
    posicionar()
    window.addEventListener('resize', posicionar)
    window.addEventListener('scroll', posicionar, true)
    return () => {
      window.removeEventListener('resize', posicionar)
      window.removeEventListener('scroll', posicionar, true)
    }
  }, [montado, ancora, largura, alinhamento])

  useEffect(() => {
    if (!montado) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        aoFechar()
      }
    }
    const onDown = (e: PointerEvent) => {
      const alvo = e.target as Node
      if (painel.current?.contains(alvo) || ancora?.contains(alvo)) return
      aoFechar()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [montado, aoFechar, ancora])

  if (!montado) return null

  return createPortal(
    <div
      ref={painel}
      className={`pop ${saindo ? 'pop-saindo' : 'pop-entrando'}`}
      role="dialog"
      aria-label={ariaLabel}
      style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}
    >
      {children}
    </div>,
    document.body,
  )
}

/** Botão que abre um Popover — cuida da âncora e do estado aberto/fechado. */
export function useGatilho() {
  const ref = useRef<HTMLButtonElement>(null)
  const [aberto, setAberto] = useState(false)
  return {
    ref,
    aberto,
    abrir: () => setAberto(true),
    fechar: () => setAberto(false),
    alternar: () => setAberto((a) => !a),
    ancora: ref.current,
  }
}
