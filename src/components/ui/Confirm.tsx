import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMontagemAnimada, usePrendeFoco } from './Popover'

/* Confirmação com a cara do app no lugar do window.confirm, que é uma janela do
   sistema operacional. Usado em tudo que é difícil de desfazer: arquivar,
   excluir, encolher a manta, aplicar um esquema por cima do que já existe. */

export interface PedidoConfirmacao {
  titulo: string
  descricao?: ReactNode
  okLabel?: string
  cancelarLabel?: string
  perigo?: boolean
  /** exige digitar esta palavra para liberar o botão — para o que não tem volta */
  confirmarDigitando?: string
}

type Resolver = (ok: boolean) => void

const Ctx = createContext<((p: PedidoConfirmacao) => Promise<boolean>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)
  const [texto, setTexto] = useState('')
  const resolver = useRef<Resolver | null>(null)
  const caixa = useRef<HTMLDivElement>(null)
  const { montado, saindo } = useMontagemAnimada(pedido !== null, 200)

  usePrendeFoco(caixa, montado && !saindo)

  const confirmar = useCallback((p: PedidoConfirmacao) => {
    setTexto('')
    setPedido(p)
    return new Promise<boolean>((res) => {
      resolver.current = res
    })
  }, [])

  const responder = (ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setPedido(null)
  }

  const liberado = !pedido?.confirmarDigitando || texto.trim() === pedido.confirmarDigitando

  return (
    <Ctx.Provider value={confirmar}>
      {children}
      {montado &&
        pedido &&
        createPortal(
          <div
            className={`ov ${saindo ? 'ov-saindo' : 'ov-entrando'}`}
            onClick={() => responder(false)}
            onKeyDown={(e) => e.key === 'Escape' && responder(false)}
          >
            <div
              ref={caixa}
              className="modal"
              role="alertdialog"
              aria-modal="true"
              aria-label={pedido.titulo}
              style={{ maxWidth: 420 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h" style={{ fontSize: 19, marginBottom: 8 }}>
                {pedido.titulo}
              </div>
              {pedido.descricao && (
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--ink-soft)',
                    marginBottom: 18,
                  }}
                >
                  {pedido.descricao}
                </div>
              )}
              {pedido.confirmarDigitando && (
                <>
                  <div className="lbl" style={{ marginBottom: 7 }}>
                    DIGITE <b style={{ color: 'var(--accent)' }}>{pedido.confirmarDigitando}</b> PARA
                    CONFIRMAR
                  </div>
                  <input
                    className="field"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    aria-label={`Digite ${pedido.confirmarDigitando} para confirmar`}
                    style={{ marginBottom: 18 }}
                  />
                </>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="pill ghost" onClick={() => responder(false)}>
                  {pedido.cancelarLabel ?? 'Cancelar'}
                </button>
                <button
                  type="button"
                  className="pill"
                  disabled={!liberado}
                  style={
                    pedido.perigo
                      ? { background: 'var(--accent)', opacity: liberado ? 1 : 0.5 }
                      : { opacity: liberado ? 1 : 0.5 }
                  }
                  onClick={() => responder(true)}
                >
                  {pedido.okLabel ?? 'Confirmar'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  )
}

/** `const confirmar = useConfirmar()` → `if (await confirmar({...})) ...` */
export function useConfirmar() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirmar fora do ConfirmProvider')
  return ctx
}
