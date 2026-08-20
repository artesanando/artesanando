import { useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Lbl, Progress } from '../../components/ui/bits'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Calendario, MenuKebab } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useAcoesArquivo } from '../../components/ui/useAcoesItem'
import { separaArquivados } from '../../lib/arquivo'
import { fmtDataCurta, fmtDataLonga, hojeIso } from '../../lib/format'
import {
  criarIntegranteSemConta,
  encontrosPassados,
  fetchEncontros,
  fetchIntegrantesAtivas,
  fetchPresencas,
  filtraEncontros,
  marcarPresenca,
  mediaPresentes,
  presentesDe,
  proximoEncontro,
} from './api'

export function PresencaPage() {
  const { isAdmin, open, openEncontro } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { encontroId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const acoesArquivo = useAcoesArquivo()
  const hoje = hojeIso()

  const [busca, setBusca] = useState('')
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

  const { ativos } = separaArquivados(encontros ?? [])
  const passados = encontrosPassados(ativos, hoje)
  const proximo = proximoEncontro(ativos, hoje)
  const selecionado = ativos.find((e) => e.id === encontroId) ?? passados[0] ?? proximo
  const listados = filtraEncontros(passados, busca)

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

  /* Anota alguém que ainda não tem conta: cria o perfil sem acesso e já marca
     presença. Quando ela for convidada, o mesmo perfil ganha login e este dia
     continua na frequência dela. */
  const adicionarAvulsa = useMutation({
    mutationFn: async (nome: string) => {
      const id = await criarIntegranteSemConta(nome)
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
      toast('Adicionada à chamada ✓')
    },
    onError: () => toast('Não foi possível adicionar.', 'erro'),
  })

  const presenteDe = (integranteId: string) =>
    (presencas ?? []).some(
      (p) => p.encontro_id === selecionado?.id && p.integrante_id === integranteId && p.presente,
    )

  const totalIntegrantes = (integrantes ?? []).length
  const presentesSel = selecionado ? presentesDe(presencas ?? [], selecionado.id) : 0
  const diasComEncontro = ativos.map((e) => e.data)

  return (
    <div className="pagina">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 22,
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Presença
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {passados.length} encontros no semestre · média de{' '}
            {mediaPresentes(ativos, presencas ?? [], hoje)} presentes
          </div>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('encontro')}>
            + Novo encontro
          </button>
        )}
      </div>

      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}

      <div className="pgrid" style={{ '--cols': '1fr 1.3fr', '--gap': '40px' } as CSSProperties}>
        <div>
          {/* achar um dia: o calendário marca os dias que têm encontro */}
          <div className="card" style={{ padding: 12, marginBottom: 16 }}>
            <Calendario
              valor={selecionado?.data ?? hoje}
              marcados={diasComEncontro}
              onChange={(dia) => {
                const achado = ativos.find((e) => e.data === dia)
                if (achado) navigate(`/presenca/${achado.id}`)
                else toast('Nenhum encontro neste dia.')
              }}
            />
          </div>

          {proximo && (
            <button
              onClick={() => navigate(`/presenca/${proximo.id}`)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: '1px solid var(--chip-rose-border)',
                background: 'var(--chip-rose)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 16,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Lbl style={{ color: 'var(--accent)' }}>PRÓXIMO ENCONTRO</Lbl>
              <div className="h" style={{ fontSize: 20, margin: '6px 0 2px' }}>
                {fmtDataLonga(proximo.data)}
                {proximo.hora ? ` · ${proximo.hora.slice(0, 5)}h` : ''}
              </div>
              <div style={{ fontSize: 12.5, color: '#8E6B70' }}>
                {proximo.local ?? ''}
                {proximo.pauta ? ` · pauta: ${proximo.pauta}` : ''}
              </div>
            </button>
          )}

          <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
            Encontros anteriores
          </div>
          <input
            className="field"
            style={{ borderRadius: 99, marginBottom: 12 }}
            placeholder="🔍 Buscar por data, sala ou pauta…"
            aria-label="Buscar encontro"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {listados.map((e) => {
              const n = presentesDe(presencas ?? [], e.id)
              const pct = totalIntegrantes === 0 ? 0 : Math.round((n / totalIntegrantes) * 100)
              const ativo = e.id === selecionado?.id
              return (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <button
                    onClick={() => navigate(`/presenca/${e.id}`)}
                    aria-current={ativo ? 'true' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      flex: 1,
                      minWidth: 0,
                      padding: '13px 2px',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 13.5, width: 74, flex: 'none' }}>
                      {fmtDataCurta(e.data)}
                    </span>
                    <Progress
                      pct={`${pct}%`}
                      style={{ flex: 1 }}
                      fillStyle={ativo ? undefined : { background: '#D8A3AE' }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: ativo ? 800 : 700,
                        color: ativo ? 'var(--accent)' : 'var(--muted)',
                        width: 88,
                        textAlign: 'right',
                        flex: 'none',
                      }}
                    >
                      {n} presentes
                    </span>
                  </button>
                  {isAdmin && (
                    <MenuKebab
                      ariaLabel={`Ações do encontro de ${fmtDataCurta(e.data)}`}
                      acoes={[
                        { label: 'Editar encontro', onSelect: () => openEncontro(e.id) },
                        ...acoesArquivo({
                          tabela: 'encontros',
                          id: e.id,
                          nome: `o encontro de ${fmtDataCurta(e.data)}`,
                          motivoHistorico: 'A chamada já feita',
                          arquivado: Boolean(e.arquivado_em),
                          invalidar: ['encontros', 'presencas'],
                        }),
                      ]}
                    />
                  )}
                </div>
              )
            })}
            {listados.length === 0 && !isLoading && (
              <div style={{ padding: '13px 2px', fontSize: 13, color: 'var(--muted)' }}>
                {busca ? `Nenhum encontro para "${busca}".` : 'Nenhum encontro registrado ainda.'}
              </div>
            )}
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
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                  {presentesSel}/{totalIntegrantes} presentes
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                {selecionado.hora ? `${selecionado.hora.slice(0, 5)}h` : ''}
                {selecionado.local ? ` · ${selecionado.local}` : ''}
                {selecionado.pauta ? ` · ${selecionado.pauta}` : ''}
                {isAdmin && (
                  <button
                    className="crumb"
                    style={{
                      border: 'none',
                      background: 'none',
                      fontFamily: 'inherit',
                      marginLeft: 8,
                      color: 'var(--accent)',
                    }}
                    onClick={() => openEncontro(selecionado.id)}
                  >
                    editar
                  </button>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)' }}>
                {(integrantes ?? []).map((p) => {
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
                        disabled={!isAdmin}
                        onClick={() => marcar.mutate({ integranteId: p.id, presente: !presente })}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          cursor: isAdmin ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          fontFamily: 'inherit',
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
                        ✓
                      </button>
                    </div>
                  )
                })}
              </div>

              {isAdmin && (
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
            </>
          ) : (
            !isLoading && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Crie o primeiro encontro para abrir a chamada.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
