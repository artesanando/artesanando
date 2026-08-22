import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMontagemAnimada, usePrendeFoco } from './Popover'
import { Select } from './controles'

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
  /* Texto livre pedido junto da confirmação: dar um crédito à mão sem dizer por
     quê deixa a auditoria com uma linha que não explica nada. Só `usePedirTexto`
     enxerga o que foi digitado. */
  campo?: {
    rotulo: string
    placeholder?: string
    obrigatorio?: boolean
    /** com opções o campo vira uma lista em vez de texto livre */
    opcoes?: [string, string][]
    padrao?: string
  }
}

type Resolver = (valor: boolean | string | null) => void

const Ctx = createContext<((p: PedidoConfirmacao) => Promise<boolean>) | null>(null)
const CtxTexto = createContext<((p: PedidoConfirmacao) => Promise<string | null>) | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null)
  const [texto, setTexto] = useState('')
  const [livre, setLivre] = useState('')
  const resolver = useRef<Resolver | null>(null)
  const devolveTexto = useRef(false)
  const caixa = useRef<HTMLDivElement>(null)
  const { montado, saindo } = useMontagemAnimada(pedido !== null, 200)

  usePrendeFoco(caixa, montado && !saindo)

  const abrir = useCallback((p: PedidoConfirmacao, comTexto: boolean) => {
    setTexto('')
    setLivre(p.campo?.padrao ?? '')
    devolveTexto.current = comTexto
    setPedido(p)
    return new Promise<boolean | string | null>((res) => {
      resolver.current = res
    })
  }, [])

  const confirmar = useCallback(
    (p: PedidoConfirmacao) => abrir(p, false) as Promise<boolean>,
    [abrir],
  )
  const perguntar = useCallback(
    (p: PedidoConfirmacao) => abrir(p, true) as Promise<string | null>,
    [abrir],
  )

  const responder = (ok: boolean) => {
    resolver.current?.(devolveTexto.current ? (ok ? livre.trim() : null) : ok)
    resolver.current = null
    setPedido(null)
  }

  const palavraOk = !pedido?.confirmarDigitando || texto.trim() === pedido.confirmarDigitando
  const campoOk = !pedido?.campo?.obrigatorio || livre.trim().length > 0
  const liberado = palavraOk && campoOk

  return (
    <Ctx.Provider value={confirmar}>
      <CtxTexto.Provider value={perguntar}>
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
              {pedido.campo && (
                <div style={{ marginBottom: 18 }}>
                  <div className="lbl" style={{ marginBottom: 7 }}>
                    {pedido.campo.rotulo}
                  </div>
                  {pedido.campo.opcoes ? (
                    <Select
                      value={livre}
                      onChange={setLivre}
                      options={pedido.campo.opcoes}
                      ariaLabel={pedido.campo.rotulo}
                      placeholder={pedido.campo.placeholder}
                    />
                  ) : (
                    <input
                      className="field"
                      value={livre}
                      onChange={(e) => setLivre(e.target.value)}
                      placeholder={pedido.campo.placeholder}
                      aria-label={pedido.campo.rotulo}
                    />
                  )}
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
      </CtxTexto.Provider>
    </Ctx.Provider>
  )
}

/** `const confirmar = useConfirmar()` → `if (await confirmar({...})) ...` */
export function useConfirmar() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirmar fora do ConfirmProvider')
  return ctx
}

/** Mesma caixa, mas devolve o que foi digitado no `campo` — nulo se cancelar */
export function usePedirTexto() {
  const ctx = useContext(CtxTexto)
  if (!ctx) throw new Error('usePedirTexto fora do ConfirmProvider')
  return ctx
}
