import type { ReactNode } from 'react'
import { IconChevron } from './icons'

/* Cabeçalho de coluna que ordena ao clicar. A seta só aparece na coluna ativa —
   uma seta em toda coluna vira ruído e não diz mais nada. */
export function ColunaOrdenavel({
  rotulo,
  ativa,
  direcao,
  aoClicar,
  centro,
  extra,
}: {
  rotulo: string
  ativa: boolean
  direcao: 'asc' | 'desc'
  aoClicar: () => void
  centro?: boolean
  /** ajuda ou qualquer coisa que fique ao lado do rótulo */
  extra?: ReactNode
}) {
  return (
    <div
      role="columnheader"
      aria-sort={ativa ? (direcao === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{ textAlign: centro ? 'center' : 'left' }}
    >
      <button
        type="button"
        onClick={aoClicar}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          font: 'inherit',
          letterSpacing: 'inherit',
          color: ativa ? 'var(--ink-soft)' : 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {rotulo}
        {ativa && <IconChevron size={10} para={direcao === 'asc' ? 'cima' : 'baixo'} />}
      </button>
      {extra}
    </div>
  )
}
