import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lbl, PasswordField } from '../components/ui/bits'
import { useAuth } from '../state/auth'
import { senhaEscolhida } from '../features/perfil/api'
import { ModalBox } from './shared'

/* Não passa pelo ModalRoot de propósito: lá todo modal fecha no Esc e no clique
   fora, e este não fecha — a senha atual é a que a administradora gerou e leu.
   O ModalBox entra mesmo assim, porque é ele que traz o padding de celular, o
   foco preso e o scroll travado no fundo. */
export function ModalPrimeiraSenha() {
  const { profile, updatePassword, refreshProfile } = useAuth()
  const qc = useQueryClient()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    setErro(null)
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    try {
      await updatePassword(senha)
      await senhaEscolhida(profile!.id)
      await refreshProfile()
      qc.invalidateQueries({ queryKey: ['integrantes'] })
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <div className="ov ov-entrando">
      <ModalBox maxWidth={420} titulo="Escolha sua senha">
        <div className="h" style={{ fontSize: 22, marginBottom: 20 }}>
          Escolha sua senha
        </div>

        <Lbl style={{ marginBottom: 7 }}>NOVA SENHA</Lbl>
        <PasswordField
          value={senha}
          onChange={setSenha}
          style={{ marginBottom: 18 }}
          autoComplete="new-password"
          ariaLabel="Nova senha"
        />
        <Lbl style={{ marginBottom: 7 }}>CONFIRMAR SENHA</Lbl>
        <PasswordField
          value={confirma}
          onChange={setConfirma}
          style={{ marginBottom: 16 }}
          autoComplete="new-password"
          ariaLabel="Confirmar senha"
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
          type="button"
          className="pill"
          onClick={salvar}
          disabled={salvando}
          style={{ width: '100%', padding: 13, fontSize: 14, opacity: salvando ? 0.7 : 1 }}
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </ModalBox>
    </div>
  )
}
