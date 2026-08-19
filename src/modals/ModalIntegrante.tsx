import { useState, type FormEvent } from 'react'
import { Campo, LegendaObrigatorio, useFormulario } from '../components/ui/Campo'
import { Select } from '../components/ui/controles'
import { ModalBox, ModalHeader } from './shared'
import { supabase } from '../lib/supabase'
import { useStore } from '../state/store'
import type { Papel, Preferencia } from '../types/database'

const PREFS: [Preferencia, string][] = [
  ['croche', 'Crochê'],
  ['trico', 'Tricô'],
  ['ambos', 'Crochê e tricô'],
]

export function ModalIntegrante() {
  const { close } = useStore()
  const form = useFormulario<'nome' | 'usuario' | 'email'>()

  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [preferencia, setPreferencia] = useState<Preferencia>('croche')
  const [papel, setPapel] = useState<Papel>('integrante')
  const [erro, setErro] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    const valido = form.checar({
      nome: nome.trim() ? undefined : 'Informe o nome completo.',
      usuario: usuario.trim() ? undefined : 'Escolha um nome de usuário.',
      email: email.includes('@') ? undefined : 'Informe um email válido.',
    })
    if (!valido) return

    setEnviando(true)
    const { data, error } = await supabase.functions.invoke('invite-member', {
      body: {
        nome: nome.trim(),
        usuario: usuario.trim().toLowerCase(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        preferencia,
        papel,
        redirectTo: window.location.origin + '/definir-senha',
      },
    })
    setEnviando(false)

    const corpo = data as { error?: string; link?: string | null } | null
    if (error || corpo?.error) {
      setErro(corpo?.error ?? 'Não foi possível enviar o convite. Tente novamente.')
      return
    }
    setLink(corpo?.link ?? null)
    setOk(true)
  }

  const copiar = async () => {
    if (!link) return
    await navigator.clipboard?.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const segStyle = (on: boolean) =>
    on ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : undefined

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Cadastrar integrante"
        sub="Ela recebe um convite para criar a própria senha"
      />
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
            ✓ Convite criado para <b>{email}</b>.
          </div>

          {/* O email só sai se o SMTP estiver configurado no Supabase. Com o link
              copiável o convite funciona de qualquer jeito — por WhatsApp, na mão. */}
          {link && (
            <>
              <div className="lbl" style={{ marginBottom: 7 }}>
                OU MANDE ESTE LINK DIRETO
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  className="field"
                  readOnly
                  value={link}
                  aria-label="Link de convite"
                  onFocus={(e) => e.currentTarget.select()}
                  style={{ flex: 1, minWidth: 180, fontSize: 12 }}
                />
                <button type="button" className="pill" onClick={copiar}>
                  {copiado ? 'Copiado ✓' : 'Copiar'}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 20 }}>
                O link vale uma vez e expira — se demorar, mande outro convite.
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
                  placeholder="Giulia Santos"
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
                  placeholder="giulia.santos"
                />
              )}
            </Campo>
          </div>

          <Campo
            label="EMAIL"
            obrigatorio
            erro={form.erros.email}
            dica="é para lá que vai o convite"
            style={{ marginBottom: 18 }}
          >
            {(p) => (
              <input
                {...p}
                className="field"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  form.aoMudar('email')
                }}
                placeholder="giulia@email.com"
              />
            )}
          </Campo>

          <div className="grid2" style={{ marginBottom: 18 }}>
            <Campo label="TELEFONE / WHATSAPP (OPCIONAL)">
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

          <div className="lbl" style={{ marginBottom: 7 }}>
            PERFIL
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
              <button type="submit" className="pill" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar convite'}
              </button>
            </div>
          </div>
        </form>
      )}
    </ModalBox>
  )
}
