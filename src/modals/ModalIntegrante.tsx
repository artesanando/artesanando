import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { Select } from '../components/ui/controles'
import { ModalBox, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import { fetchIntegrantes } from '../features/integrantes/api'
import { TURNO_LABEL, type Papel, type Preferencia, type Turno } from '../types/database'

const TURNOS: [Turno, string][] = (['diurno', 'noturno', 'ambos'] as Turno[]).map((t) => [
  t,
  TURNO_LABEL[t],
])

const PREFS: [Preferencia, string][] = [
  ['croche', 'Crochê'],
  ['trico', 'Tricô'],
  ['ambos', 'Crochê e tricô'],
]

export function ModalIntegrante() {
  const { close, integranteId } = useStore()
  const form = useFormulario<'nome' | 'usuario'>()

  /* Convite de quem já entrou pela chamada: o perfil existe e só falta a conta.
     O id vai junto para o banco ligar a conta a ESTE perfil — sem ele nascia
     uma segunda ficha e as presenças antigas ficavam órfãs. */
  const { data: integrantes } = useQuery({
    queryKey: ['integrantes'],
    queryFn: fetchIntegrantes,
    enabled: !!integranteId,
  })
  const alvo = (integrantes ?? []).find((p) => p.id === integranteId)
  const convidando = !!integranteId

  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [telefone, setTelefone] = useState('')
  const [preferencia, setPreferencia] = useState<Preferencia>('croche')
  const [turno, setTurno] = useState<Turno>('ambos')
  const [papel, setPapel] = useState<Papel>('integrante')
  const [erro, setErro] = useState<string | null>(null)
  const [acesso, setAcesso] = useState<{ usuario: string; senha: string } | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    const valido = form.checar({
      nome: convidando || nome.trim() ? undefined : 'Informe o nome completo.',
      usuario: convidando || usuario.trim() ? undefined : 'Escolha um nome de usuário.',
    })
    if (!valido) return

    setEnviando(true)
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: {
        profileId: integranteId,
        nome: convidando ? alvo!.nome : nome.trim(),
        usuario: (convidando ? alvo!.usuario : usuario).trim().toLowerCase(),
        telefone: (convidando ? (alvo!.telefone ?? '') : telefone).trim() || null,
        preferencia: convidando ? alvo!.preferencia : preferencia,
        turno: convidando ? alvo!.turno : turno,
        papel: convidando ? alvo!.papel : papel,
      },
    })
    setEnviando(false)

    const corpo = data as { error?: string; usuario?: string; senha?: string } | null
    if (error || corpo?.error || !corpo?.senha) {
      setErro(corpo?.error ?? 'Não foi possível criar o acesso. Tente novamente.')
      return
    }
    setAcesso({ usuario: corpo.usuario ?? '', senha: corpo.senha })
    setOk(true)
  }

  const copiar = async () => {
    if (!acesso) return
    await navigator.clipboard?.writeText(acesso.senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const segStyle = (on: boolean) =>
    on ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : undefined

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title={convidando ? `Convidar ${alvo?.nome ?? ''}` : 'Cadastrar integrante'} />
      {ok ? (
        <>
          <div
            style={{
              background: 'var(--chip-green)',
              border: '1px solid var(--chip-green-border)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: 'var(--green-dark)',
              marginBottom: 16,
            }}
          >
            Acesso criado para <b>{convidando ? (alvo?.nome ?? '') : nome.trim()}</b>.
          </div>

          {/* Era um link de uso único, e o preview do WhatsApp gastava o token
              antes de a pessoa tocar nele — o convite chegava expirado. Usuário
              e senha atravessam qualquer conversa sem se gastar. */}
          {acesso && (
            <>
              <div className="lbl" style={{ marginBottom: 7 }}>
                USUÁRIO
              </div>
              <div className="field" style={{ marginBottom: 12, fontWeight: 700 }}>
                {acesso.usuario}
              </div>
              <div className="lbl" style={{ marginBottom: 7 }}>
                SENHA PROVISÓRIA
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  className="field"
                  readOnly
                  value={acesso.senha}
                  aria-label="Senha provisória"
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ flex: 1, minWidth: 180, fontWeight: 700, letterSpacing: 1 }}
                />
                <button type="button" className="pill" onClick={copiar}>
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--gold-dark)', marginBottom: 20 }}>
                Mande os dois só em conversa privada. Ela troca a senha em Meu perfil depois de
                entrar.
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="pill" onClick={close}>
              Fechar
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={cadastrar}>
          {convidando ? (
            <div
              style={{
                background: 'var(--sand-soft)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 18,
                fontSize: 13,
              }}
            >
              <b>{alvo?.nome ?? '—'}</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>@{alvo?.usuario ?? ''}</div>
            </div>
          ) : (
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
                    placeholder="Ada Lovelace"
                  />
                )}
              </Campo>
              <Campo label="USUÁRIO" obrigatorio erro={form.erros.usuario}>
                {(p) => (
                  <input
                    {...p}
                    className="field"
                    value={usuario}
                    onChange={(e) => {
                      setUsuario(e.target.value)
                      form.aoMudar('usuario')
                    }}
                    placeholder="ada.lovelace"
                  />
                )}
              </Campo>
            </div>
          )}

          {!convidando && (
            <>
              <div className="grid2" style={{ marginBottom: 18 }}>
                <Campo label="TELEFONE / WHATSAPP">
                  {(p) => (
                    <input
                      {...p}
                      className="field"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 9 8888-0000"
                    />
                  )}
                </Campo>
                <Campo label="PREFERÊNCIA">
                  {() => (
                    <Select
                      ariaLabel="Preferência"
                      value={preferencia}
                      onChange={setPreferencia}
                      options={PREFS}
                    />
                  )}
                </Campo>
              </div>

              {/* o turno define de quais encontros ela é cobrada na frequência */}
              <div className="grid2" style={{ marginBottom: 18 }}>
                <Campo label="TURNO">
                  {() => (
                    <Select ariaLabel="Turno" value={turno} onChange={setTurno} options={TURNOS} />
                  )}
                </Campo>
              </div>

              <div className="lbl" style={{ marginBottom: 7 }}>
                PAPEL
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <button
                  type="button"
                  className="seg"
                  aria-pressed={papel === 'integrante'}
                  onClick={() => setPapel('integrante')}
                  style={segStyle(papel === 'integrante')}
                >
                  Integrante
                </button>
                <button
                  type="button"
                  className="seg"
                  aria-pressed={papel === 'admin'}
                  onClick={() => setPapel('admin')}
                  style={segStyle(papel === 'admin')}
                >
                  Administradora
                </button>
              </div>
            </>
          )}

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
              <button type="button" className="pill ghost" onClick={close}>
                Cancelar
              </button>
              <button type="submit" className="pill" disabled={enviando || (convidando && !alvo)}>
                {enviando ? 'Gerando…' : 'Gerar convite'}
              </button>
            </div>
          </div>
        </form>
      )}
    </ModalBox>
  )
}
