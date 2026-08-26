import { Component, type ReactNode } from 'react'

interface State {
  erro: boolean
}

/* Sem rede ou bug inesperado = erro recuperável, nunca tela branca */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { erro: false }

  static getDerivedStateFromError(): State {
    return { erro: true }
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="card" style={{ maxWidth: 440, padding: '28px 32px', textAlign: 'center' }}>
          <div className="h" style={{ fontSize: 20, marginBottom: 8 }}>
            Algo deu errado por aqui
          </div>
          <div
            style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-soft)', marginBottom: 18 }}
          >
            Pode ser a conexão ou um erro passageiro.
          </div>
          <button className="pill" onClick={() => window.location.reload()}>
            Recarregar a página
          </button>
        </div>
      </div>
    )
  }
}
