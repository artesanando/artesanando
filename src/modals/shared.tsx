import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
    /* um bloco só, e não dois irmãos soltos: no celular ele gruda no topo da
       folha, e o título precisa continuar visível enquanto o formulário rola */
    <div className="modal-topo">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div id={id} className="h" style={{ fontSize: 22 }}>
          {title}
        </div>
        <button className="x" onClick={close} aria-label="Fechar">
          <IconX size={15} />
        </button>
      </div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
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
  const [tela, setTela] = useState(false)

  usePrendeFoco(caixa, true)

  /* Formulário que ocupa quase a tela toda vira tela cheia de verdade: a folha
     de 816px numa tela de 844 deixava uma tira do cabeçalho aparecendo atrás,
     que parece acidente. Medido, e não decidido modal a modal, porque o
     conteúdo cresce sozinho — o de projeto ganha campos ao escolher crochê. */
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setTela(el.scrollHeight > window.innerHeight * 0.85)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    window.addEventListener('resize', medir)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [])

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
        className={`modal${tela ? ' modal-tela' : ''}`}
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
