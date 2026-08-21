import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useStore } from '../state/store'
import { usePrendeFoco } from '../components/ui/Popover'
import { IconX } from '../components/ui/icons'

/* O título do ModalHeader é o rótulo acessível do diálogo: o ModalBox gera o id
   e passa por contexto, o header o carimba no <h>, e o `aria-labelledby` liga os
   dois. Antes o id existia mas ninguém apontava para ele — o diálogo ficava sem
   nome para quem usa leitor de tela. */
const IdTitulo = createContext<string | undefined>(undefined)

/* `sub` só existe onde a linha carrega informação que o título não dá — não é
   lugar de explicar o óbvio. */
export function ModalHeader({ title, sub }: { title: string; sub?: string }) {
  const { close } = useStore()
  const id = useContext(IdTitulo)
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
        <div id={id} className="h" style={{ fontSize: 22 }}>
          {title}
        </div>
        <button className="x" onClick={close} aria-label="Fechar">
          <IconX size={15} />
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
  const id = useRef(`modal-titulo-${++seq}`)

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
    <IdTitulo.Provider value={titulo ? undefined : id.current}>
      <div
        ref={caixa}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        aria-labelledby={titulo ? undefined : id.current}
        style={{ maxWidth, ...(noPadding ? { padding: 0, overflow: 'hidden' } : {}) }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </IdTitulo.Provider>
  )
}
