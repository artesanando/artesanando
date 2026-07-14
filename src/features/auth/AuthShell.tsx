import type { ReactNode } from 'react'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
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
