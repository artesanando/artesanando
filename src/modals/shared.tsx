import { useEffect, useRef, type ReactNode } from 'react'
import { useStore } from '../state/store'
import { usePrendeFoco } from '../components/ui/Popover'

/* `sub` só existe onde a linha carrega informação que o título não dá — não é
   lugar de explicar o óbvio. */
export function ModalHeader({ title, sub }: { title: string; sub?: string }) {
  const { close } = useStore()
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: sub ? 4 : 20,
        }}
      >
        <div className="h" style={{ fontSize: 22 }}>
          {title}
        </div>
        <button className="x" onClick={close} aria-label="Fechar">
          ×
        </button>
      </div>
      {sub && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>{sub}</div>
      )}
    </>
  )
}

export function ModalFooter({ okLabel, cancelLabel }: { okLabel: string; cancelLabel?: string }) {
  const { close } = useStore()
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button className="pill ghost" onClick={close}>
        {cancelLabel || 'Cancelar'}
      </button>
      <button className="pill" onClick={close}>
        {okLabel}
      </button>
    </div>
  )
}

/* O título do modal é o rótulo acessível: ModalHeader renderiza um .h e o
   ModalBox aponta para ele por id. */
let seq = 0

export function ModalBox({
  maxWidth,
  children,
  noPadding,
  titulo,
}: {
  maxWidth: number
  children: ReactNode
  noPadding?: boolean
  /** rótulo acessível quando o modal não usa ModalHeader */
  titulo?: string
}) {
  const caixa = useRef<HTMLDivElement>(null)
  const id = useRef(`modal-${++seq}`)

  usePrendeFoco(caixa, true)

  // o fundo não deve rolar enquanto o modal está aberto
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = antes
    }
  }, [])

  return (
    <div
      ref={caixa}
      id={id.current}
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      style={{ maxWidth, ...(noPadding ? { padding: 0, overflow: 'hidden' } : {}) }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
