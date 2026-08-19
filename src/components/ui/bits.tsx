import { useState, type CSSProperties, type ReactNode } from 'react'
import { fmtCentavos, parseCentavos } from '../../lib/format'

/* Peças visuais pequenas reutilizadas nas telas — mesmos estilos do protótipo */

export function Lbl({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return (
    <div className="lbl" style={style}>
      {children}
    </div>
  )
}

export function PasswordField({
  value,
  onChange,
  style,
  autoComplete,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  style?: CSSProperties
  autoComplete?: string
  ariaLabel?: string
}) {
  const [mostrar, setMostrar] = useState(false)
  return (
    <div
      className="field"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--chip-soft)',
        ...style,
      }}
    >
      <input
        type={mostrar ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'none',
          fontFamily: 'inherit',
          fontSize: 13,
          color: 'var(--ink)',
          padding: 0,
          width: '100%',
        }}
      />
      <button
        type="button"
        onClick={() => setMostrar((m) => !m)}
        aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--faint)',
          display: 'flex',
          flex: 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeWidth="1.8"
            d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"
          />
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
          {mostrar && <line x1="2" y1="21" x2="22" y2="3" strokeWidth="1.8" />}
        </svg>
      </button>
    </div>
  )
}

export function Avatar({
  color,
  size = 26,
  fontSize = 10,
  children,
  style,
  src,
  alt,
}: {
  color: string
  size?: number
  fontSize?: number
  children: ReactNode
  style?: CSSProperties
  /** foto do perfil; sem ela ficam as iniciais sobre a cor */
  src?: string | null
  alt?: string
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
        overflow: 'hidden',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        children
      )}
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

/* Controles reais (M2) — o Select vive em ./controles porque abre pop-up próprio */

const passo: CSSProperties = {
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 15,
  padding: '0 8px',
  cursor: 'pointer',
  lineHeight: 1,
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  suffix,
  ariaLabel,
  id,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
  ariaLabel?: string
  id?: string
}) {
  return (
    <div
      className="field"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <button
        type="button"
        aria-label="Diminuir"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ ...passo, color: 'var(--faint)', opacity: value <= min ? 0.4 : 1 }}
      >
        −
      </button>
      <b
        id={id}
        role="spinbutton"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onChange(Math.min(max, value + 1))
          if (e.key === 'ArrowDown') onChange(Math.max(min, value - 1))
        }}
      >
        {value}
        {suffix ? ` ${suffix}` : ''}
      </b>
      <button
        type="button"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ ...passo, color: 'var(--accent)', opacity: value >= max ? 0.4 : 1 }}
      >
        +
      </button>
    </div>
  )
}

export function CurrencyField({
  centavos,
  onChange,
  color,
  ariaLabel,
}: {
  centavos: number
  onChange: (c: number) => void
  color?: string
  ariaLabel?: string
}) {
  return (
    <input
      className="field h"
      style={{ fontSize: 20, color: color ?? 'var(--ink)' }}
      value={fmtCentavos(centavos)}
      onChange={(e) => onChange(parseCentavos(e.target.value))}
      inputMode="numeric"
      aria-label={ariaLabel ?? 'Valor'}
    />
  )
}

