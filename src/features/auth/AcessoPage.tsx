import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lbl } from '../../components/ui/bits'
import { lerAcesso } from '../../lib/acesso'
import { AuthShell } from './AuthShell'

/* Página pública: quem abre o link ainda não tem como se autenticar. Não busca
   nada no servidor — o que ela mostra vem do próprio fragmento da URL, então
   abrir de novo funciona igual, quantas vezes for. */
export function AcessoPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const acesso = lerAcesso(hash)
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    if (!acesso) return
    await navigator.clipboard?.writeText(acesso.senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  if (!acesso) {
    return (
      <AuthShell>
        <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 4 }}>
          Link incompleto
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Peça outro à administradora.</div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 26 }}>
        Seu acesso
      </div>

      <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
      <div className="field" style={{ marginBottom: 18, fontWeight: 700 }}>
        {acesso.usuario}
      </div>

      <Lbl style={{ marginBottom: 7 }}>SENHA PROVISÓRIA</Lbl>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          className="field"
          readOnly
          value={acesso.senha}
          aria-label="Senha provisória"
          onFocus={(e) => e.currentTarget.select()}
          style={{ flex: 1, minWidth: 160, fontWeight: 700, letterSpacing: 1 }}
        />
        <button type="button" className="pill" onClick={copiar}>
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 22 }}>
        Dá para trocar usuário e senha em Meu perfil.
      </div>

      <button
        type="button"
        className="pill"
        onClick={() => navigate('/login')}
        style={{ width: '100%', padding: 13, fontSize: 14 }}
      >
        Entrar
      </button>
    </AuthShell>
  )
}
