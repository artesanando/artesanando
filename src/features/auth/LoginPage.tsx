import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Lbl } from '../../components/ui/bits'

export function LoginPage() {
  const { auth, login } = useAuth()
  const navigate = useNavigate()

  if (auth) return <Navigate to="/" replace />

  const entrar = () => {
    login()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        style={{
          width: '52%',
          flex: 'none',
          background: 'var(--primary)',
          color: '#fff',
          padding: '56px 60px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="h" style={{ fontSize: 24 }}>
          Artesanando<span style={{ color: '#F3D9DE' }}>.</span>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div
            className="h"
            style={{ fontWeight: 500, fontSize: 38, lineHeight: 1.15, letterSpacing: '-.5px' }}
          >
            Cada ponto
            <br />
            vira acolhimento.
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: '#F6DEE3',
              marginTop: 18,
              maxWidth: 400,
            }}
          >
            Um espaço para organizar mantas, amigurumis, materiais e encontros do nosso projeto de
            extensão — juntas, no mesmo lugar.
          </div>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          padding: '56px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 340, width: '100%', margin: '0 auto' }}>
          <div className="h" style={{ fontWeight: 500, fontSize: 26, marginBottom: 4 }}>
            Bem-vinda de volta
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 30 }}>
            Entre com seu usuário e senha
          </div>
          <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
          <input className="field" style={{ marginBottom: 18 }} defaultValue="regina.prof" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span className="lbl">SENHA</span>
            <span
              style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
            >
              esqueci
            </span>
          </div>
          <input
            className="field"
            type="password"
            style={{ marginBottom: 14 }}
            defaultValue="12345678"
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              color: 'var(--ink-soft)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: 'var(--primary)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              ✓
            </span>
            Manter conectada
          </div>
          <button
            className="pill"
            style={{ width: '100%', padding: 13, fontSize: 14 }}
            onClick={entrar}
          >
            Entrar
          </button>
          <div
            style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}
          >
            Não tem acesso? Fale com uma <b style={{ color: 'var(--accent)' }}>administradora</b>.
          </div>
        </div>
      </div>
    </div>
  )
}
