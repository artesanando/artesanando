import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Lbl, PasswordField } from '../../components/ui/bits'
import { erroDeUsuario, normalizaUsuario } from '../../lib/usuario'
import { AuthShell, ErroAuth } from './AuthShell'

const SENHA_MIN = 8

/* Página pública: o link vai no grupo e não existe botão para ela em lugar
   nenhum do app. Cria a conta e já entra — o signUp devolve a sessão, então não
   há por que pedir a mesma senha de novo na tela seguinte. */
export function CadastroPage() {
  const { session, cadastrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (session) return <Navigate to="/" replace />

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!nome.trim()) {
      setErro('Informe seu nome completo.')
      return
    }
    const problema = erroDeUsuario(usuario)
    if (problema) {
      setErro(problema)
      return
    }
    if (senha.length < SENHA_MIN) {
      setErro(`A senha precisa de ${SENHA_MIN} caracteres.`)
      return
    }

    setEnviando(true)
    try {
      await cadastrar(nome, usuario, senha)
      navigate('/')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={criar}>
        <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 26 }}>
          Criar conta
        </div>

        <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18, background: 'var(--chip-soft)' }}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="name"
          aria-label="Nome completo"
          placeholder="Ada Lovelace"
        />

        <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18, background: 'var(--chip-soft)' }}
          value={usuario}
          onChange={(e) => setUsuario(normalizaUsuario(e.target.value))}
          autoComplete="username"
          aria-label="Usuário"
          placeholder="ada.lovelace"
        />

        <Lbl style={{ marginBottom: 7 }}>SENHA</Lbl>
        <PasswordField
          value={senha}
          onChange={setSenha}
          style={{ marginBottom: 18 }}
          autoComplete="new-password"
          ariaLabel="Senha"
        />

        {erro && <ErroAuth>{erro}</ErroAuth>}

        <button
          type="submit"
          className="pill"
          disabled={enviando}
          style={{ width: '100%', padding: 13, fontSize: 14, opacity: enviando ? 0.7 : 1 }}
        >
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              padding: '0 12px',
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            já tem conta? entrar
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
