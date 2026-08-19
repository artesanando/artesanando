import { useRef, useState, type ReactNode } from 'react'

/* Rótulo + controle + erro. Antes, cada modal validava no submit e jogava uma
   única mensagem genérica no topo — nada dizia QUAL campo era obrigatório nem
   qual deles estava faltando. */

let seq = 0

export function Campo({
  label,
  obrigatorio,
  erro,
  dica,
  children,
  style,
}: {
  label: string
  obrigatorio?: boolean
  erro?: string
  /** texto de apoio abaixo do controle */
  dica?: string
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
  style?: React.CSSProperties
}) {
  const id = useRef(`campo-${++seq}`).current
  const idErro = `${id}-erro`

  return (
    <div style={style}>
      <label htmlFor={id} className="lbl" style={{ display: 'block', marginBottom: 7 }}>
        {label}
        {obrigatorio && (
          <span aria-hidden="true" style={{ color: 'var(--accent)', marginLeft: 3 }}>
            *
          </span>
        )}
        {obrigatorio && <span className="so-leitor"> (obrigatório)</span>}
      </label>
      <div className={erro ? 'com-erro' : undefined}>
        {children({
          id,
          'aria-invalid': Boolean(erro),
          'aria-describedby': erro ? idErro : undefined,
        })}
      </div>
      {erro && (
        <div
          id={idErro}
          role="alert"
          style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginTop: 5 }}
        >
          {erro}
        </div>
      )}
      {!erro && dica && (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 5 }}>{dica}</div>
      )}
    </div>
  )
}

/** Legenda do asterisco — vai uma vez por formulário, perto do botão de salvar. */
export function LegendaObrigatorio() {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
      <span style={{ color: 'var(--accent)' }}>*</span> campo obrigatório
    </div>
  )
}

export type Erros<T extends string> = Partial<Record<T, string>>

/**
 * Validação de formulário: `validar` devolve os erros; se houver algum, o foco
 * vai para o primeiro campo com problema.
 */
export function useFormulario<T extends string>() {
  const [erros, setErros] = useState<Erros<T>>({})

  const checar = (regras: Erros<T>) => {
    const encontrados = Object.fromEntries(
      Object.entries(regras).filter(([, msg]) => Boolean(msg)),
    ) as Erros<T>
    setErros(encontrados)
    return Object.keys(encontrados).length === 0
  }

  return {
    erros,
    checar,
    limpar: () => setErros({}),
    /** apaga o erro de um campo assim que a pessoa mexe nele */
    aoMudar: (campo: T) => setErros((e) => ({ ...e, [campo]: undefined })),
  }
}
