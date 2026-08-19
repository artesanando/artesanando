import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth'
import { ini } from '../../lib/format'
import { Avatar, Lbl } from '../../components/ui/bits'
import { PAPEL_LABEL, type Preferencia } from '../../types/database'
import { atualizarPerfil } from './api'

export function PerfilPage() {
  const { profile, refreshProfile, updatePassword } = useAuth()
  const navigate = useNavigate()
  // estado local inicializado uma vez a partir do profile (nunca controlado pela query)
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [telefone, setTelefone] = useState(profile?.telefone ?? '')
  const [preferencia, setPreferencia] = useState<Preferencia>(profile?.preferencia ?? 'ambos')
  const [salvando, setSalvando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const [senhaAberta, setSenhaAberta] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [senhaMsg, setSenhaMsg] = useState<string | null>(null)

  if (!profile) return null

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setFeedback(null)
    if (!nome.trim()) {
      setErro('O nome não pode ficar vazio.')
      return
    }
    setSalvando(true)
    try {
      await atualizarPerfil(profile.id, {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        preferencia,
      })
    } catch {
      setSalvando(false)
      setErro('Não foi possível salvar. Tente novamente.')
      return
    }
    setSalvando(false)
    await refreshProfile()
    setFeedback('Alterações salvas ✓')
  }

  const salvarSenha = async () => {
    setSenhaMsg(null)
    if (novaSenha.length < 8) {
      setSenhaMsg('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    try {
      await updatePassword(novaSenha)
      setNovaSenha('')
      setSenhaAberta(false)
      setSenhaMsg('Senha alterada ✓')
    } catch {
      setSenhaMsg('Não foi possível alterar a senha.')
    }
  }

  return (
    <form onSubmit={salvar} className="pagina" style={{ maxWidth: 760 }}>
      <div className="crumb" onClick={() => navigate('/')} style={{ marginBottom: 10 }}>
        ‹ Voltar
      </div>
      <div className="h" style={{ fontWeight: 500, fontSize: 28, marginBottom: 22 }}>
        Meu perfil
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
        }}
      >
        <Avatar color={profile.avatar_color} size={66} fontSize={22}>
          {ini(profile.nome)}
        </Avatar>
        <div>
          <div className="h" style={{ fontSize: 19 }}>
            {profile.nome}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            @{profile.usuario} · {PAPEL_LABEL[profile.papel]}
          </div>
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>NOME COMPLETO</Lbl>
          <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>USUÁRIO</Lbl>
          <div
            className="field"
            style={{
              background: '#F1EAE4',
              color: 'var(--muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            {profile.usuario} <span style={{ fontSize: 11 }}>🔒</span>
          </div>
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>TELEFONE / WHATSAPP</Lbl>
          <input
            className="field"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 9 0000-0000"
          />
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>PREFERÊNCIA</Lbl>
          <select
            className="field"
            value={preferencia}
            onChange={(e) => setPreferencia(e.target.value as Preferencia)}
            style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="croche">Crochê</option>
            <option value="trico">Tricô</option>
            <option value="ambos">Crochê e tricô</option>
          </select>
        </div>
      </div>
      <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
        Segurança
      </div>
      <div className="card" style={{ padding: '14px 16px', marginBottom: 24 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Senha</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {senhaMsg === 'Senha alterada ✓' ? senhaMsg : 'Troque quando quiser'}
            </div>
          </div>
          <button
            type="button"
            className="pill ghost"
            onClick={() => setSenhaAberta((a) => !a)}
          >
            Alterar senha
          </button>
        </div>
        {senhaAberta && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
            <input
              className="field"
              type="password"
              placeholder="Nova senha (mín. 8 caracteres)"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              style={{ flex: 1 }}
            />
            <button type="button" className="pill" onClick={salvarSenha}>
              Salvar senha
            </button>
          </div>
        )}
        {senhaMsg && senhaMsg !== 'Senha alterada ✓' && (
          <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>{senhaMsg}</div>
        )}
      </div>
      {(feedback || erro) && (
        <div
          role={erro ? 'alert' : 'status'}
          style={{
            borderRadius: 10,
            padding: '9px 13px',
            fontSize: 12.5,
            marginBottom: 14,
            background: erro ? 'var(--chip-soft)' : 'var(--chip-green)',
            border: `1px solid ${erro ? 'var(--chip-rose-border)' : 'var(--chip-green-border)'}`,
            color: erro ? 'var(--primary-dark)' : 'var(--green-dark)',
          }}
        >
          {erro ?? feedback}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="pill ghost" onClick={() => navigate('/')}>
          Cancelar
        </button>
        <button type="submit" className="pill" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
