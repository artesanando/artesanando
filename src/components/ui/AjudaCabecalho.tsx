import { Dica } from './controles'
import { IconAjuda } from './icons'

/* Explicação de uma coluna de tabela. O rótulo sozinho não diz o que entra na
   conta — "ENTREGAS" e "TOTAL" foram os dois que confundiram no uso. */
export function AjudaCabecalho({ texto }: { texto: string }) {
  return (
    <Dica texto={texto}>
      <button
        type="button"
        aria-label={texto}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          marginLeft: 4,
          cursor: 'help',
          color: 'var(--faint)',
          verticalAlign: 'middle',
          display: 'inline-flex',
        }}
      >
        <IconAjuda size={12} />
      </button>
    </Dica>
  )
}
