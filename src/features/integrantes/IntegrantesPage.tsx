import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { supabase } from '../../lib/supabase'
import { Lbl, Progress } from '../../components/ui/bits'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { MenuKebab, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { hojeIso } from '../../lib/format'
import { useSemestreAtivo } from '../../lib/semestre'
import { fetchEmprestimosAtivos } from '../estoque/api'
import { fetchEncontros, fetchPresencas, frequenciaDe } from '../presenca/api'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import { IconChevron } from '../../components/ui/icons'
import {
  definirAtivo,
  definirNivel,
  emprestadosDe,
  entregasDe,
  fetchEntregasLight,
  fetchIntegrantes,
  fetchRas,
  filtraIntegrantes,
  vincularPerfil,
} from './api'
import {
  NIVEL_LABEL,
  PREFERENCIA_LABEL,
  TURNO_LABEL,
  type Nivel,
  type Profile,
  type Turno,
} from '../../types/database'

const NIVEIS: [Nivel, string][] = (['iniciante', 'experiente'] as Nivel[]).map((n) => [
  n,
  NIVEL_LABEL[n],
])

/* A frequência total tem denominador diferente do diurno e do noturno: quem é
   de um turno só não leva falta pelo outro. Por isso são três leituras da mesma
   pessoa, e não uma soma das outras duas. */
const VISTAS: [Turno, string][] = [
  ['ambos', 'Total'],
  ['diurno', 'Diurno'],
  ['noturno', 'Noturno'],
]

export function IntegrantesPage() {
  const { isAdmin, openIntegrante } = useStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const { id } = useParams()
  const [busca, setBusca] = useState('')
  const [avisoAberto, setAvisoAberto] = useState(false)
  const [vinculando, setVinculando] = useState<string | null>(null)
  const [destino, setDestino] = useState('')
  const [linkSenhaPara, setLinkSenhaPara] = useState<string | null>(null)
  const [linkSenha, setLinkSenha] = useState<string | null>(null)
  const [gerandoLink, setGerandoLink] = useState(false)
  const [copiadoSenha, setCopiadoSenha] = useState(false)
  const [vistaFreq, setVistaFreq] = useState<Turno>('ambos')
  const hoje = hojeIso()

  const { data: integrantes, isLoading } = useQuery({
    queryKey: ['integrantes'],
    queryFn: fetchIntegrantes,
  })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })
  // a policy decide o que vem: admin recebe todas as linhas, as demais só a própria
  const { data: ras } = useQuery({ queryKey: ['ras'], queryFn: fetchRas })
  const semestre = useSemestreAtivo()

  /* Frequência e entregas passam a ser do semestre ativo. Antes somavam desde o
     começo do app, e a ficha dizia "no semestre" mostrando o acumulado de anos. */
  const doSemestre = (encontros ?? []).filter(
    (e) => !semestre || e.semestre_id === semestre.id,
  )

  const lista = filtraIntegrantes(integrantes ?? [], busca)
  const sel = (integrantes ?? []).find((p) => p.id === id) ?? lista[0]

  const freqDe = (p: Profile) => frequenciaDe(p.id, doSemestre, presencas ?? [], hoje, p.turno)

  const selFreq = sel ? freqDe(sel) : null
  const selEntregas =
    sel && entregas
      ? entregasDe(sel.id, entregas, semestre?.id ?? null)
      : { amigurumis: 0, faixas: 0, grannies: 0, total: 0 }
  const selEmprestados = sel ? emprestadosDe(sel.id, loans ?? []) : 0
  const vista = vistaFreq === 'ambos' ? 'total' : vistaFreq
  const selRa = sel ? ras?.get(sel.id) : undefined

  const mudarNivel = useMutation({
    mutationFn: ({ id: alvo, nivel }: { id: string; nivel: Nivel }) => definirNivel(alvo, nivel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrantes'] })
      toast('Nível atualizado')
    },
    onError: () => toast('Não foi possível mudar o nível.', 'erro'),
  })

  /* Quem entrou pela chamada existe como perfil sem conta. Enquanto não for
     convidada (ou juntada a uma ficha existente), fica sinalizada aqui. */
  const semConta = (integrantes ?? []).filter((p) => !p.user_id)
  const comConta = (integrantes ?? []).filter((p) => p.user_id)

  const vincular = useMutation({
    mutationFn: ({ origem, para }: { origem: string; para: string }) =>
      vincularPerfil(origem, para),
    onSuccess: () => {
      setVinculando(null)
      setDestino('')
      qc.invalidateQueries({ queryKey: ['integrantes'] })
      qc.invalidateQueries({ queryKey: ['presencas'] })
      qc.invalidateQueries({ queryKey: ['entregas-light'] })
      toast('Fichas juntadas')
    },
    onError: () => toast('Não foi possível juntar as fichas.', 'erro'),
  })

  const desativar = useMutation({
    mutationFn: ({ pid, ativo }: { pid: string; ativo: boolean }) => definirAtivo(pid, ativo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrantes'] })
      toast('Integrante atualizada')
    },
    onError: () => toast('Não foi possível atualizar.', 'erro'),
  })

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Integrantes"
        sub={`${(integrantes ?? []).length} cadastradas`}
        acoes={
          isAdmin && (
            <button className="pill" onClick={() => openIntegrante(null)}>
              + Cadastrar
            </button>
          )
        }
      />
      <div
        className="pgrid"
        style={{ '--cols': '1.1fr 1fr', '--gap': '40px' } as React.CSSProperties}
      >
      <div>
        <input
          className="field"
          style={{ borderRadius: 99, marginBottom: 14 }}
          placeholder="Buscar integrante…"
          aria-label="Buscar integrante"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {isAdmin && semConta.length > 0 && (
          <div
            style={{
              background: 'var(--chip-warn)',
              border: '1px solid #E7D6B8',
              borderRadius: 12,
              padding: '11px 14px',
              marginBottom: 14,
              fontSize: 12.5,
              color: 'var(--gold-dark)',
            }}
          >
            {/* Nasce recolhido: é um lembrete permanente enquanto alguém estiver
                sem perfil, e aberto ele empurrava a lista para fora da tela. */}
            <button
              type="button"
              aria-expanded={avisoAberto}
              onClick={() => setAvisoAberto((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12.5,
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <IconChevron size={11} para={avisoAberto ? 'cima' : 'baixo'} />
              <b>
                {semConta.length}{' '}
                {semConta.length === 1 ? 'pessoa na chamada' : 'pessoas na chamada'} ainda sem
                perfil
              </b>
            </button>
            {avisoAberto && (
              <div style={{ marginTop: 8 }}>
                Convide para o app, ou junte a ficha a uma integrante que já existe.
              </div>
            )}
            {avisoAberto &&
              semConta.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}
              >
                <b style={{ flex: 1, minWidth: 100 }}>{p.nome}</b>
                {vinculando === p.id ? (
                  <>
                    <span style={{ minWidth: 170, flex: 1 }}>
                      <Select
                        ariaLabel={`Juntar ${p.nome} a qual integrante`}
                        value={destino}
                        onChange={setDestino}
                        options={[
                          ['', 'Juntar com…'],
                          ...comConta.map((d) => [d.id, d.nome] as [string, string]),
                        ]}
                      />
                    </span>
                    <button
                      className="pill"
                      style={{ padding: '7px 14px', fontSize: 12 }}
                      disabled={!destino || vincular.isPending}
                      onClick={() => vincular.mutate({ origem: p.id, para: destino })}
                    >
                      Juntar
                    </button>
                    <button
                      className="pill ghost"
                      style={{ padding: '7px 14px', fontSize: 12 }}
                      onClick={() => setVinculando(null)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="pill ghost"
                      style={{ padding: '7px 14px', fontSize: 12 }}
                      onClick={() => openIntegrante(p.id)}
                    >
                      Convidar
                    </button>
                    <button
                      className="pill ghost"
                      style={{ padding: '7px 14px', fontSize: 12 }}
                      onClick={() => setVinculando(p.id)}
                    >
                      Juntar a outra
                    </button>
                  </>
                )}
                </div>
              ))}
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {isLoading && (
            <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--muted)' }}>
              Carregando…
            </div>
          )}
          {lista.length === 0 && !isLoading && (
            <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--muted)' }}>
              Ninguém encontrada{busca ? ` para "${busca}"` : ''}.
            </div>
          )}
          {lista.map((p) => {
            const selected = p.id === sel?.id
            const emprestados = emprestadosDe(p.id, loans ?? [])
            const ent = entregas ? entregasDe(p.id, entregas).total : 0
            const sub = `${ent} entregas${emprestados > 0 ? ` · ${emprestados} itens em casa` : ''}`
            const freq = freqDe(p)
            return (
              <div key={p.id}>
              <div
                onClick={() => navigate(`/integrantes/${p.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  ...(selected
                    ? { background: 'var(--chip-rose)', borderRadius: 10, margin: '6px 0' }
                    : { borderBottom: '1px solid var(--border)' }),
                }}
              >
                <AvatarPerfil
                  nome={p.nome}
                  avatarColor={p.avatar_color}
                  avatarUrl={p.avatar_url}
                  size={32}
                  fontSize={12}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>
                    {p.nome}
                    {!p.user_id && (
                      <span
                        className="tag"
                        style={{
                          background: 'var(--chip-warn)',
                          color: 'var(--gold-dark)',
                          fontSize: 9.5,
                          marginLeft: 6,
                        }}
                      >
                        SEM PERFIL
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: selected ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: 600,
                    }}
                  >
                    {sub}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {freq.total.pct}%
                </div>
                {isAdmin && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <MenuKebab
                      ariaLabel={`Ações de ${p.nome}`}
                      acoes={[
                        ...(p.user_id
                          ? [
                              {
                                label: 'Gerar link de nova senha',
                                onSelect: async () => {
                                  setLinkSenha(null)
                                  setLinkSenhaPara(p.id)
                                  setGerandoLink(true)
                                  const { data, error } = await supabase.functions.invoke(
                                    'reset-password-link',
                                    {
                                      body: {
                                        profileId: p.id,
                                        redirectTo: window.location.origin + '/redefinir-senha',
                                      },
                                    },
                                  )
                                  setGerandoLink(false)
                                  const corpo = data as { error?: string; link?: string | null } | null
                                  if (error || corpo?.error) {
                                    toast(corpo?.error ?? 'Não foi possível gerar o link.', 'erro')
                                    setLinkSenhaPara(null)
                                    return
                                  }
                                  setLinkSenha(corpo?.link ?? null)
                                },
                              },
                            ]
                          : []),
                        {
                          label: 'Desativar',
                          perigo: true,
                          onSelect: async () => {
                            const ok = await confirmar({
                              titulo: `Desativar ${p.nome}?`,
                              okLabel: 'Desativar',
                              perigo: true,
                            })
                            if (ok) desativar.mutate({ pid: p.id, ativo: false })
                          },
                        },
                      ]}
                    />
                  </span>
                )}
              </div>
              {linkSenhaPara === p.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '10px 8px 14px', borderBottom: '1px solid var(--border)' }}
                >
                  {gerandoLink && (
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Gerando link…</div>
                  )}
                  {linkSenha && (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <input
                          className="field"
                          readOnly
                          value={linkSenha}
                          aria-label={`Link de nova senha de ${p.nome}`}
                          onFocus={(e) => e.currentTarget.select()}
                          style={{ flex: 1, minWidth: 180, fontSize: 12 }}
                        />
                        <button
                          type="button"
                          className="pill"
                          onClick={async () => {
                            await navigator.clipboard?.writeText(linkSenha)
                            setCopiadoSenha(true)
                            setTimeout(() => setCopiadoSenha(false), 2500)
                          }}
                        >
                          {copiadoSenha ? 'Copiado' : 'Copiar'}
                        </button>
                        <button
                          type="button"
                          className="pill ghost"
                          onClick={() => {
                            setLinkSenhaPara(null)
                            setLinkSenha(null)
                          }}
                        >
                          Fechar
                        </button>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--gold-dark)' }}>
                        Esse link vale como senha — mande só em conversa privada.
                      </div>
                    </>
                  )}
                </div>
              )}
              </div>
            )
          })}
        </div>
      </div>
      {sel && (
        <div className="card" style={{ borderRadius: 16, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <AvatarPerfil
              nome={sel.nome}
              avatarColor={sel.avatar_color}
              avatarUrl={sel.avatar_url}
              size={52}
              fontSize={18}
            />
            <div>
              <div className="h" style={{ fontSize: 19 }}>
                {sel.nome}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                @{sel.usuario}
                {sel.desde ? ` · desde ${sel.desde}` : ''} ·{' '}
                {PREFERENCIA_LABEL[sel.preferencia].toLowerCase()}
                {/* o RA nem chega ao front de quem não é admin: a policy de
                    `perfis_academico` só devolve a linha da própria dona */}
                {isAdmin && selRa ? ` · RA ${selRa}` : ''}
              </div>
              {isAdmin && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                    fontSize: 11.5,
                    color: 'var(--muted)',
                  }}
                >
                  <span className="lbl">NÍVEL</span>
                  <span style={{ minWidth: 132 }}>
                    <Select
                      value={sel.nivel}
                      onChange={(n) => mudarNivel.mutate({ id: sel.id, nivel: n })}
                      options={NIVEIS}
                      ariaLabel={`Nível de ${sel.nome}`}
                    />
                  </span>
                </div>
              )}
            </div>
          </div>
          <Lbl style={{ marginBottom: 12 }}>ENTREGAS NO SEMESTRE</Lbl>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#C08A2E' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Amigurumis concluídos</span>
              <b style={{ fontSize: 15 }}>{selEntregas.amigurumis}</b>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#7D9B76' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Faixas de tricô feitas</span>
              <b style={{ fontSize: 15 }}>{selEntregas.faixas}</b>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#C4798A' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                Granny squares prontos
              </span>
              <b style={{ fontSize: 15 }}>{selEntregas.grannies}</b>
            </div>
          </div>
          {selEmprestados > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--chip-rose)',
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 11.5,
                color: 'var(--primary-dark)',
                marginBottom: 16,
              }}
            >
              {selEmprestados} {selEmprestados === 1 ? 'item emprestado' : 'itens emprestados'}{' '}
              em casa — veja no Estoque.
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 190 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <Lbl>FREQUÊNCIA</Lbl>
                <span style={{ width: 118 }}>
                  <Select
                    value={vistaFreq}
                    onChange={setVistaFreq}
                    options={VISTAS}
                    ariaLabel="Turno da frequência"
                  />
                </span>
              </div>
              <Progress pct={`${selFreq?.[vista].pct ?? 0}%`} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {selFreq?.[vista].presentes ?? 0}/{selFreq?.[vista].total ?? 0} encontros ·{' '}
                {selFreq?.[vista].pct ?? 0}%
                {/* o total dela não é a soma dos dois turnos: quem é de um turno
                    só não tem o outro no denominador */}
                {vistaFreq === 'ambos' ? ` · ${TURNO_LABEL[sel.turno].toLowerCase()}` : ''}
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                borderLeft: '1px solid var(--border)',
                paddingLeft: 16,
              }}
            >
              <div className="h" style={{ fontSize: 24, color: 'var(--accent)' }}>
                {selEntregas.total}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>entregas no semestre</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
