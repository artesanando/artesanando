import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Lbl, PasswordField } from '../../components/ui/bits'
import { AuthShell } from './AuthShell'
import { IconCheck } from '../../components/ui/icons'

export function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [manter, setManter] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/" replace />

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!usuario || !senha) {
      setErro('Preencha usuário e senha.')
      return
    }
    setEnviando(true)
    try {
      await login(usuario, senha, manter)
      navigate('/')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={entrar}>
        <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18, background: 'var(--chip-soft)' }}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          aria-label="Usuário"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span className="lbl">SENHA</span>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            esqueceu? peça uma senha à administradora
          </span>
        </div>
        <PasswordField
          value={senha}
          onChange={setSenha}
          style={{ marginBottom: 14 }}
          autoComplete="current-password"
          ariaLabel="Senha"
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            color: 'var(--ink-soft)',
            marginBottom: 18,
            cursor: 'pointer',
          }}
        >
          <span
            onClick={(e) => {
              e.preventDefault()
              setManter((m) => !m)
            }}
            style={{
              width: 16,
              height: 16,
              borderRadius: 5,
              background: manter ? 'var(--primary)' : 'transparent',
              border: manter ? 'none' : '1.5px solid var(--field-border)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              flex: 'none',
            }}
          >
            {manter && <IconCheck size={12} />}
          </span>
          Manter conectada
        </label>
        {erro && (
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
            {erro}
          </div>
        )}
        <button
          type="submit"
          className="pill"
          disabled={enviando}
          style={{ width: '100%', padding: 13, fontSize: 14, opacity: enviando ? 0.7 : 1 }}
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  )
}
