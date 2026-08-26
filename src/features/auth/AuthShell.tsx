import type { ReactNode } from 'react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 20px',
      }}
    >
      <div className="h" style={{ fontSize: 27, marginBottom: 32 }}>
        Artesanando<span style={{ color: 'var(--primary)' }}>.</span>
      </div>
      <div
        className="card"
        style={{ width: '100%', maxWidth: 470, borderRadius: 22, padding: '38px 42px' }}
      >
        {children}
      </div>
    </div>
  )
}

/* Mesma caixa de erro nas duas telas de fora do app: entrar e cadastrar. */
export function ErroAuth({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        background: 'var(--chip-soft)',
        border: '1px solid var(--chip-rose-border)',
        borderRadius: 10,
        padding: '9px 13px',
        fontSize: 12.5,
        color: 'var(--primary-dark)',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  )
}
