import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { Lbl, PasswordField } from '../../components/ui/bits'
import { AuthShell } from './AuthShell'

/* Quando o link não vale mais, o Supabase devolve o motivo no fragmento da URL
   e nenhuma sessão. Sem ler isto a tela só mostrava um aviso genérico e o botão
   ficava travado — no celular a leitura era "cliquei e não aconteceu nada". */
function motivoDoLink(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null
  const p = new URLSearchParams(hash)
  if (!p.get('error') && !p.get('error_code')) return null
  const codigo = p.get('error_code') ?? ''
  if (codigo.includes('expired')) {
    return 'Este link expirou. Peça um novo à administradora — cada link vale uma vez só.'
  }
  return 'Este link não vale mais: ou já foi aberto uma vez, ou expirou. Peça outro à administradora.'
}

/* Usada tanto em /redefinir-senha (link do "esqueci") quanto em
   /definir-senha (primeiro acesso via convite) — o link que a administradora
   mandou autentica a sessão e aqui só gravamos a nova senha. */
export function NovaSenhaPage({ modo }: { modo: 'redefinir' | 'definir' }) {
  const { session, profile, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [linkMorto] = useState(motivoDoLink)
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const titulo = modo === 'definir' ? 'Defina sua senha' : 'Redefinir senha'
  const sub = modo === 'definir' ? 'Crie a senha do seu acesso' : 'Escolha uma senha nova'

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As senhas não coincidem.')
      return
    }
    setEnviando(true)
    try {
      await updatePassword(senha)
      navigate('/')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthShell>
      <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 4 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 26 }}>{sub}</div>
      <form onSubmit={salvar}>
        {!session && (
          <div
            style={{
              background: 'var(--chip-warn)',
              borderRadius: 10,
              padding: '10px 13px',
              fontSize: 12.5,
              color: 'var(--gold-dark)',
              marginBottom: 18,
            }}
          >
            {linkMorto ?? 'Abra esta página pelo link que a administradora te mandou.'}
          </div>
        )}

        {/* Sem isto ninguém sai daqui sabendo com o que entrar depois: o convite
            não passa por email, então o usuário só aparece nesta tela. */}
        {modo === 'definir' && profile && (
          <div
            style={{
              background: 'var(--sand-soft)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 13px',
              fontSize: 12.5,
              marginBottom: 18,
            }}
          >
            Daqui em diante você entra com o usuário{' '}
            <b style={{ color: 'var(--accent)' }}>{profile.usuario}</b> e a senha que criar
            agora. Anote.
          </div>
        )}
        <Lbl style={{ marginBottom: 7 }}>NOVA SENHA</Lbl>
        <PasswordField
          value={senha}
          onChange={setSenha}
          style={{ marginBottom: 18 }}
          autoComplete="new-password"
        />
        <Lbl style={{ marginBottom: 7 }}>CONFIRMAR SENHA</Lbl>
        <PasswordField
          value={confirma}
          onChange={setConfirma}
          style={{ marginBottom: 14 }}
          autoComplete="new-password"
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
          disabled={enviando || !session}
          style={{
            width: '100%',
            padding: 13,
            fontSize: 14,
            opacity: enviando || !session ? 0.7 : 1,
          }}
        >
          {enviando ? 'Salvando…' : !session ? 'Link inválido' : 'Salvar senha'}
        </button>
      </form>
    </AuthShell>
  )
}
