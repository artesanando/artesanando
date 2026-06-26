import type { CSSProperties, ReactNode } from 'react'

/* Peças visuais pequenas reutilizadas nas telas — mesmos estilos do protótipo */

export function Lbl({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div className="lbl" style={style}>
      {children}
    </div>
  )
}

export function Avatar({
  color,
  size = 26,
  fontSize = 10,
  children,
  style,
}: {
  color: string
  size?: number
  fontSize?: number
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize,
        flex: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Progress({
  pct,
  style,
  fillStyle,
}: {
  pct: string
  style?: CSSProperties
  fillStyle?: CSSProperties
}) {
  return (
    <div className="progress" style={style}>
      <div style={{ width: pct, ...fillStyle }} />
    </div>
  )
}

/* Controles "falsos" do protótipo — substituídos por controles reais no M1+ */

export function FieldSelect({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="field" style={{ display: 'flex', justifyContent: 'space-between', ...style }}>
      {children}
      <span style={{ color: 'var(--faint)' }}>▾</span>
    </div>
  )
}

export function FieldStepper({ value }: { value: string }) {
  return (
    <div
      className="field"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <span>{value}</span>
      <span style={{ color: 'var(--faint)', fontWeight: 800 }}>− +</span>
    </div>
  )
}
