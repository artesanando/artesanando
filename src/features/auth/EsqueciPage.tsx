import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Lbl } from '../../components/ui/bits'
import { AuthShell } from './AuthShell'

export function EsqueciPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!email.includes('@')) {
      setErro('Informe o email cadastrado.')
      return
    }
    setEnviando(true)
    try {
      await resetPassword(email)
      setEnviado(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 4 }}>
        Esqueci a senha
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 26 }}>
        Enviaremos um link de redefinição para o seu email
      </div>
      {enviado ? (
        <div
          style={{
            background: 'var(--chip-green)',
            border: '1px solid var(--chip-green-border)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--green-dark)',
            marginBottom: 18,
          }}
        >
          ✓ Se o email estiver cadastrado, o link chega em instantes. Confira também o spam.
        </div>
      ) : (
        <form onSubmit={enviar}>
          <Lbl style={{ marginBottom: 7 }}>EMAIL</Lbl>
          <input
            className="field"
            type="email"
            style={{ marginBottom: 14, background: 'var(--chip-soft)' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
          />
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
            {enviando ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
      <div style={{ fontSize: 12, textAlign: 'center', marginTop: 20 }}>
        <Link to="/login" style={{ fontWeight: 800, color: 'var(--accent)' }}>
          ‹ Voltar ao login
        </Link>
      </div>
    </AuthShell>
  )
}
