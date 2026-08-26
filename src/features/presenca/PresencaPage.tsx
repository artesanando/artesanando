import { useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Calendario, MenuKebab, type MarcaDia } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { fmtDataCurta, fmtDataLonga, hojeIso } from '../../lib/format'
import { TURNO_LABEL } from '../../types/database'
import { IconCheck } from '../../components/ui/icons'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import {
  contaNaFrequencia,
  criarIntegranteSemConta,
  definirCancelado,
  encontrosPassados,
  fetchEncontros,
  fetchIntegrantesAtivas,
  fetchPresencas,
  marcarPresenca,
  mediaPresentes,
  presentesDe,
  proximosVisiveis,
  ultimoAMarcar,
  type Encontro,
} from './api'

/* Cor da bolinha do calendário: o turno se lê de relance, e o cancelado fica
   visível (riscado) em vez de sumir — recesso é informação, não ausência. */
const COR_TURNO = { diurno: 'var(--gold-dark)', noturno: 'var(--blue-dark)' } as const

export function PresencaPage() {
  const { open, openEncontro } = useStore()
  const { profile, can } = useAuth()
  const navigate = useNavigate()
  const { encontroId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const hoje = hojeIso()

  /* Ver a chamada é de todas; escrever nela pede a permissão. Antes isso era
     `isAdmin` puro, e nem existia chave para delegar. */
  const podeChamada = can('presenca')

  const [novoNome, setNovoNome] = useState('')
  const [addAberto, setAddAberto] = useState(false)

  const { data: encontros, isLoading } = useQuery({
    queryKey: ['encontros'],
    queryFn: fetchEncontros,
  })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: integrantes } = useQuery({
    queryKey: ['integrantes-chamada'],
    queryFn: fetchIntegrantesAtivas,
  })

  const todos = encontros ?? []
  const passados = encontrosPassados(todos, hoje)
  const proximos = proximosVisiveis(todos, hoje)

  /* A chamada só existe com um dia escolhido. Antes ela caía sozinha no último
     encontro passado, o que fazia parecer que a chamada de hoje já estava
     aberta quando na verdade era a da semana retrasada. */
  const selecionado = todos.find((e) => e.id === encontroId)
  const cancelado = Boolean(selecionado?.cancelado_em)

  const marcas: Record<string, MarcaDia> = {}
  for (const e of todos) {
    marcas[e.data] = { cor: COR_TURNO[e.turno], riscado: Boolean(e.cancelado_em) }
  }

  const marcar = useMutation({
    mutationFn: (opts: { integranteId: string; presente: boolean }) =>
      marcarPresenca({
        encontro_id: selecionado!.id,
        integrante_id: opts.integranteId,
        presente: opts.presente,
        marcado_por: profile!.id,
      }),
    onError: () => toast('Não foi possível marcar a presença.', 'erro'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['presencas'] }),
  })

  const cancelar = useMutation({
    mutationFn: ({ id, valor }: { id: string; valor: boolean }) => definirCancelado(id, valor),
    onSuccess: (_, { valor }) => {
      qc.invalidateQueries({ queryKey: ['encontros'] })
      toast(valor ? 'Encontro cancelado' : 'Encontro reaberto')
    },
    onError: () => toast('Não foi possível mudar o encontro.', 'erro'),
  })

  /* Anota alguém que ainda não tem conta: cria o perfil sem acesso e já marca
     presença. Quando ela for convidada, o mesmo perfil ganha login. */
  const adicionarAvulsa = useMutation({
    mutationFn: async (nome: string) => {
      const id = await criarIntegranteSemConta(
        nome,
        selecionado?.turno === 'noturno' ? 'noturno' : 'diurno',
      )
      await marcarPresenca({
        encontro_id: selecionado!.id,
        integrante_id: id,
        presente: true,
        marcado_por: profile!.id,
      })
    },
    onSuccess: () => {
      setNovoNome('')
      setAddAberto(false)
      qc.invalidateQueries({ queryKey: ['presencas'] })
      qc.invalidateQueries({ queryKey: ['integrantes-chamada'] })
      qc.invalidateQueries({ queryKey: ['integrantes'] })
      toast('Adicionada à chamada')
    },
    onError: () => toast('Não foi possível adicionar.', 'erro'),
  })

  const presenteDe = (integranteId: string) =>
    (presencas ?? []).some(
      (p) => p.encontro_id === selecionado?.id && p.integrante_id === integranteId && p.presente,
    )

  /* A chamada lista quem vem naquele turno — quem é do noturno não precisa
     aparecer na lista de um encontro de manhã. */
  const daChamada = (integrantes ?? []).filter(
    (p) => !selecionado || p.turno === 'ambos' || p.turno === selecionado.turno,
  )
  const presentesSel = selecionado ? presentesDe(presencas ?? [], selecionado.id) : 0

  /* Não há arquivar encontro: cancelar já resolve, e o dia cancelado segue no
     calendário para quem for conferir a frequência de um semestre passado. */
  const acoesDoEncontro = (e: Encontro) => [
    { label: 'Editar encontro', onSelect: () => openEncontro(e.id) },
    {
      label: e.cancelado_em ? 'Reabrir encontro' : 'Cancelar encontro',
      onSelect: () => cancelar.mutate({ id: e.id, valor: !e.cancelado_em }),
    },
  ]

  const quemMarcou = selecionado ? ultimoAMarcar(presencas ?? [], selecionado.id) : null
  const nomeQuemMarcou = (integrantes ?? []).find((p) => p.id === quemMarcou)?.nome

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Presença"
        sub={`${passados.filter(contaNaFrequencia).length} encontros no semestre · média de ${mediaPresentes(todos, presencas ?? [], hoje)} presentes`}
        acoes={
          podeChamada && (
            <button className="pill" onClick={() => open('encontro')}>
              + Novo encontro
            </button>
          )
        }
      />

      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}

      <div className="pgrid" style={{ '--cols': '1fr 1.3fr', '--gap': '40px' } as CSSProperties}>
        <div>
          {/* achar um dia é o calendário; clicar num dia abre a chamada dele */}
          <div className="card" style={{ padding: 12, marginBottom: 8 }}>
            <Calendario
              fluido
              valor={selecionado?.data ?? hoje}
              marcas={marcas}
              onChange={(dia) => {
                const achado = todos.find((e) => e.data === dia)
                if (achado) navigate(`/presenca/${achado.id}`)
                else toast('Nenhum encontro neste dia.')
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 14,
              fontSize: 11,
              color: 'var(--muted)',
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {(['diurno', 'noturno'] as const).map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: COR_TURNO[t],
                    display: 'inline-block',
                  }}
                />
                {TURNO_LABEL[t]}
              </span>
            ))}
          </div>

          <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
            Próximos encontros
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {proximos.length === 0 && !isLoading && (
              <div style={{ padding: '13px 2px', fontSize: 13, color: 'var(--muted)' }}>
                Nenhum encontro agendado.
              </div>
            )}
            {proximos.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 2px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <button
                  onClick={() => navigate(`/presenca/${e.id}`)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 'var(--toque)',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    opacity: e.cancelado_em ? 0.5 : 1,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 13.5,
                      textDecoration: e.cancelado_em ? 'line-through' : undefined,
                    }}
                  >
                    {fmtDataLonga(e.data)}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11.5,
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {TURNO_LABEL[e.turno]}
                    {e.hora ? ` · ${e.hora.slice(0, 5)}h` : ''}
                    {e.local ? ` · ${e.local}` : ''}
                    {e.cancelado_em ? ' · cancelado' : ''}
                  </span>
                </button>
                {podeChamada && (
                  <MenuKebab
                    ariaLabel={`Ações do encontro de ${fmtDataCurta(e.data)}`}
                    acoes={acoesDoEncontro(e)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          {selecionado ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 4,
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div className="h" style={{ fontSize: 16 }}>
                  Chamada · {fmtDataCurta(selecionado.data)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                    {presentesSel}/{daChamada.length} presentes
                  </span>
                  {podeChamada && (
                    <MenuKebab
                      ariaLabel={`Ações do encontro de ${fmtDataCurta(selecionado.data)}`}
                      acoes={acoesDoEncontro(selecionado)}
                    />
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                {TURNO_LABEL[selecionado.turno]}
                {selecionado.hora ? ` · ${selecionado.hora.slice(0, 5)}h` : ''}
                {selecionado.local ? ` · ${selecionado.local}` : ''}
                {selecionado.pauta ? ` · ${selecionado.pauta}` : ''}
              </div>

              {cancelado ? (
                <div
                  role="status"
                  style={{
                    background: 'var(--chip-warn)',
                    border: '1px solid #E7D6B8',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 12.5,
                    color: 'var(--gold-dark)',
                  }}
                >
                  Encontro cancelado — não entra na frequência de ninguém.
                </div>
              ) : (
                <>
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {daChamada.map((p) => {
                      const presente = presenteDe(p.id)
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '11px 2px',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <AvatarPerfil
                            nome={p.nome}
                            avatarColor={p.avatar_color}
                            avatarUrl={p.avatar_url}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.nome}</div>
                            {!p.user_id && (
                              <span
                                className="tag"
                                style={{
                                  background: 'var(--chip-warn)',
                                  color: 'var(--gold-dark)',
                                  fontSize: 9.5,
                                }}
                              >
                                SEM PERFIL
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`Marcar presença de ${p.nome}`}
                            aria-pressed={presente}
                            disabled={!podeChamada}
                            onClick={() =>
                              marcar.mutate({ integranteId: p.id, presente: !presente })
                            }
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              cursor: podeChamada ? 'pointer' : 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: 'inherit',
                              flex: 'none',
                              transition: 'background var(--dur-rapida) var(--ease-suave)',
                              ...(presente
                                ? { background: 'var(--primary)', color: '#fff', border: 'none' }
                                : {
                                    border: '1.5px dashed var(--field-border)',
                                    background: 'none',
                                    color: 'transparent',
                                  }),
                            }}
                          >
                            {presente && <IconCheck size={14} />}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {podeChamada && (
                    <div style={{ marginTop: 14 }}>
                      {!addAberto ? (
                        <button
                          className="pill ghost"
                          onClick={() => setAddAberto(true)}
                          style={{ fontSize: 12.5 }}
                        >
                          + Alguém que ainda não tem perfil
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            className="field"
                            style={{ flex: 1, minWidth: 180 }}
                            placeholder="Nome de quem veio"
                            aria-label="Nome de quem veio"
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                          />
                          <button
                            className="pill"
                            disabled={!novoNome.trim() || adicionarAvulsa.isPending}
                            onClick={() => adicionarAvulsa.mutate(novoNome)}
                          >
                            Adicionar
                          </button>
                          <button className="pill ghost" onClick={() => setAddAberto(false)}>
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {nomeQuemMarcou && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14 }}>
                      Preenchida por {nomeQuemMarcou}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            !isLoading && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {todos.length === 0
                  ? 'Crie o primeiro encontro para abrir a chamada.'
                  : 'Escolha um dia no calendário.'}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
