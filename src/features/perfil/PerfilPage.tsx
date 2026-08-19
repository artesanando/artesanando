import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Campo, LegendaObrigatorio, useFormulario } from '../../components/ui/Campo'
import { ColorPicker, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { PAPEL_LABEL, type Preferencia } from '../../types/database'
import { atualizarPerfil, subirAvatar } from './api'
import { RecorteImagem } from '../../components/ui/RecorteImagem'

const PREFS: [Preferencia, string][] = [
  ['croche', 'Crochê'],
  ['trico', 'Tricô'],
  ['ambos', 'Crochê e tricô'],
]

const campoTravado = {
  background: '#F1EAE4',
  color: 'var(--muted)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
} as const

export function PerfilPage() {
  const { profile, session, refreshProfile, updatePassword } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const form = useFormulario<'nome'>()
  const inputFoto = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(profile?.nome ?? '')
  const [telefone, setTelefone] = useState(profile?.telefone ?? '')
  const [preferencia, setPreferencia] = useState<Preferencia>(profile?.preferencia ?? 'ambos')
  const [cor, setCor] = useState(profile?.avatar_color ?? '#C4798A')
  const [salvando, setSalvando] = useState(false)

  const [aRecortar, setARecortar] = useState<File | null>(null)
  const [subindoFoto, setSubindoFoto] = useState(false)

  const [senhaAberta, setSenhaAberta] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [senhaMsg, setSenhaMsg] = useState<string | null>(null)

  if (!profile) return null

  // o email mora no auth; a coluna em profiles é o espelho dele, para as outras
  // telas poderem mostrar sem consultar o auth
  const email = profile.email ?? session?.user.email ?? '—'

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.checar({ nome: nome.trim() ? undefined : 'O nome não pode ficar vazio.' })) return
    setSalvando(true)
    try {
      await atualizarPerfil(profile.id, {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        preferencia,
        avatar_color: cor,
      })
      await refreshProfile()
      toast('Alterações salvas ✓')
    } catch {
      toast('Não foi possível salvar. Tente novamente.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const trocarFoto = async (blob: Blob) => {
    setARecortar(null)
    setSubindoFoto(true)
    try {
      const caminho = await subirAvatar(profile.id, blob)
      await atualizarPerfil(profile.id, { avatar_url: caminho })
      await refreshProfile()
      qc.invalidateQueries({ queryKey: ['avatar'] })
      qc.invalidateQueries({ queryKey: ['integrantes'] })
      toast('Foto atualizada ✓')
    } catch {
      toast('Não foi possível enviar a foto.', 'erro')
    } finally {
      setSubindoFoto(false)
    }
  }

  const removerFoto = async () => {
    try {
      await atualizarPerfil(profile.id, { avatar_url: null })
      await refreshProfile()
      qc.invalidateQueries({ queryKey: ['avatar'] })
      toast('Foto removida ✓')
    } catch {
      toast('Não foi possível remover a foto.', 'erro')
    }
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
      toast('Senha alterada ✓')
    } catch {
      setSenhaMsg('Não foi possível alterar a senha.')
    }
  }

  return (
    <>
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
            flexWrap: 'wrap',
          }}
        >
          <AvatarPerfil
            nome={profile.nome}
            avatarColor={profile.avatar_color}
            avatarUrl={profile.avatar_url}
            size={66}
            fontSize={22}
          />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="h" style={{ fontSize: 19 }}>
              {profile.nome}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              @{profile.usuario} · {PAPEL_LABEL[profile.papel]}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="pill ghost"
                style={{ padding: '7px 14px', fontSize: 12 }}
                disabled={subindoFoto}
                onClick={() => inputFoto.current?.click()}
              >
                {subindoFoto ? 'Enviando…' : profile.avatar_url ? 'Trocar foto' : 'Adicionar foto'}
              </button>
              {profile.avatar_url && (
                <button
                  type="button"
                  className="pill ghost"
                  style={{ padding: '7px 14px', fontSize: 12, color: 'var(--accent)' }}
                  onClick={removerFoto}
                >
                  Remover
                </button>
              )}
            </div>
            <input
              ref={inputFoto}
              type="file"
              accept="image/*"
              aria-label="Escolher foto de perfil"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setARecortar(f)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="NOME COMPLETO" obrigatorio erro={form.erros.nome}>
            {(p) => (
              <input
                {...p}
                className="field"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  form.aoMudar('nome')
                }}
              />
            )}
          </Campo>
          <Campo label="USUÁRIO" dica="só a administradora muda o usuário">
            {(p) => (
              <div {...p} className="field" style={campoTravado}>
                {profile.usuario} <span style={{ fontSize: 11 }}>🔒</span>
              </div>
            )}
          </Campo>
        </div>

        <div className="grid2" style={{ marginBottom: 18 }}>
          <Campo label="EMAIL" dica="é por ele que chega a recuperação de senha">
            {(p) => (
              <div {...p} className="field" style={campoTravado}>
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {email}
                </span>
                <span style={{ fontSize: 11 }}>🔒</span>
              </div>
            )}
          </Campo>
          <Campo label="TELEFONE / WHATSAPP (OPCIONAL)">
            {(p) => (
              <input
                {...p}
                className="field"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 9 0000-0000"
              />
            )}
          </Campo>
        </div>

        <div className="grid2" style={{ marginBottom: 24 }}>
          <Campo label="PREFERÊNCIA">
            {() => (
              <Select
                value={preferencia}
                onChange={setPreferencia}
                options={PREFS}
                ariaLabel="Preferência"
              />
            )}
          </Campo>
          <Campo label="COR DO AVATAR" dica="aparece quando não há foto">
            {() => <ColorPicker value={cor} onChange={setCor} ariaLabel="Cor do avatar" />}
          </Campo>
        </div>

        <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
          Segurança
        </div>
        <div className="card" style={{ padding: '14px 16px', marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>Senha</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Troque quando quiser</div>
            </div>
            <button type="button" className="pill ghost" onClick={() => setSenhaAberta((a) => !a)}>
              Alterar senha
            </button>
          </div>
          {senhaAberta && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <input
                className="field"
                type="password"
                placeholder="Nova senha (mín. 8 caracteres)"
                aria-label="Nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="button" className="pill" onClick={salvarSenha}>
                Salvar senha
              </button>
            </div>
          )}
          {senhaMsg && (
            <div role="alert" style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
              {senhaMsg}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <LegendaObrigatorio />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pill ghost" onClick={() => navigate('/')}>
              Cancelar
            </button>
            <button type="submit" className="pill" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </form>

      {aRecortar && (
        <RecorteImagem
          arquivo={aRecortar}
          redondo
          saida={{ largura: 256, altura: 256 }}
          aoConfirmar={trocarFoto}
          aoCancelar={() => setARecortar(null)}
        />
      )}
    </>
  )
}
