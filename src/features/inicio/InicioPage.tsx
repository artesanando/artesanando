import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Progress } from '../../components/ui/bits'
import { fmtDataLonga, hojeIso, tempoRelativo } from '../../lib/format'
import { fetchEmprestimosAtivos, fetchEstoque } from '../estoque/api'
import {
  fetchProgressoGeral,
  fetchProjetos,
  progressoFaixas,
  progressoSquares,
  progressoUnidades,
  type Projeto,
} from '../projetos/api'
import { fetchEncontros, proximoEncontro } from '../presenca/api'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import {
  fetchAtividadesRecentes,
  fetchTotalIntegrantes,
  novelosKpis,
  primeiroNome,
  projetosAtivos,
  saudacao,
} from './api'

export function InicioPage() {
  const { isAdmin, open } = useStore()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const hoje = hojeIso()

  const { data: totalIntegrantes } = useQuery({
    queryKey: ['total-integrantes'],
    queryFn: fetchTotalIntegrantes,
  })
  const { data: itens } = useQuery({ queryKey: ['estoque'], queryFn: fetchEstoque })
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })
  const { data: projetos } = useQuery({ queryKey: ['projetos'], queryFn: fetchProjetos })
  const { data: prog } = useQuery({ queryKey: ['progresso-geral'], queryFn: fetchProgressoGeral })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: atividades } = useQuery({
    queryKey: ['atividades-recentes'],
    queryFn: fetchAtividadesRecentes,
  })

  const novelos = novelosKpis(itens ?? [], loans ?? [])
  const ativos = projetosAtivos(projetos ?? [])
  const proximo = proximoEncontro(encontros ?? [], hoje)

  const kpis: [string | number, string][] = [
    [totalIntegrantes ?? '—', 'integrantes'],
    [novelos.emEstoque, 'novelos em estoque'],
    [novelos.emprestados, 'novelos emprestados'],
    [ativos.mantas, 'mantas em andamento'],
    [ativos.amigurumis, 'amigurumis ativos'],
  ]

  const progressoDe = (p: Projeto) => {
    if (!prog) return { done: 0, total: 0 }
    if (p.tipo === 'manta_croche')
      return progressoSquares(prog.squares.filter((s) => s.projeto_id === p.id))
    if (p.tipo === 'manta_trico')
      return progressoFaixas(prog.faixas.filter((f) => f.projeto_id === p.id))
    return progressoUnidades(
      prog.unidades.filter((u) => u.projeto_id === p.id),
      p.meta,
    )
  }

  const emProducao = (projetos ?? []).filter((p) => p.status === 'ativo')

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo={`${saudacao(new Date().getHours())}, ${primeiroNome(profile?.nome ?? '')}`}
        sub={
          <>
            {fmtDataLonga(hoje)}
            {proximo && (
              <>
                {' '}
                — próximo encontro{' '}
                <b
                  style={{ color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={() => navigate(`/presenca/${proximo.id}`)}
                >
                  {fmtDataLonga(proximo.data).toLowerCase()}
                  {proximo.hora ? `, ${proximo.hora.slice(0, 5)}h` : ''}
                  {proximo.local ? ` · ${proximo.local}` : ''}
                </b>
              </>
            )}
          </>
        }
        acoes={
          isAdmin && (
            <button className="pill" onClick={() => open('projeto')}>
              + Novo projeto
            </button>
          )
        }
      />
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--border-strong)',
          borderBottom: '1px solid var(--border-strong)',
          padding: '18px 0',
          marginBottom: 30,
        }}
      >
        {kpis.map(([n, l], i) => (
          <div
            key={l}
            style={{
              flex: 1,
              padding: '0 22px',
              borderRight: i < kpis.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div className="h" style={{ fontSize: 30 }}>
              {n}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      <div
        className="pgrid"
        style={{ '--cols': '1.55fr 1fr', '--gap': '44px' } as React.CSSProperties}
      >
        <div>
          <div className="h" style={{ fontSize: 17, marginBottom: 14 }}>
            Em produção
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {emProducao.length === 0 && (
              <div style={{ padding: '16px 2px', fontSize: 13, color: 'var(--muted)' }}>
                Nenhum projeto ativo — crie o primeiro.
              </div>
            )}
            {emProducao.map((p) => {
              const pr = progressoDe(p)
              const pct = pr.total === 0 ? 0 : Math.round((pr.done / pr.total) * 100)
              const sufixo =
                p.tipo === 'manta_croche'
                  ? ` squares`
                  : p.tipo === 'manta_trico'
                    ? ' faixas'
                    : ' und'
              const etiqueta =
                p.tipo === 'manta_croche'
                  ? '· crochê'
                  : p.tipo === 'manta_trico'
                    ? '· tricô'
                    : '· amigurumi'
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projetos/${p.id}`)}
                  style={{
                    padding: '16px 2px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.nome}{' '}
                      <span style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--muted)' }}>
                        {etiqueta}
                        {p.destino ? ` · ${p.destino}` : ''}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        flex: 'none',
                      }}
                    >
                      {pr.done}/{pr.total}
                      {sufixo}
                    </div>
                  </div>
                  <Progress pct={`${pct}%`} style={{ margin: '10px 0 0' }} />
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <div className="h" style={{ fontSize: 17, marginBottom: 14 }}>
            Atividade recente
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(atividades ?? []).length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Nada registrado ainda.</div>
            )}
            {(atividades ?? []).map((a, i, arr) => (
              <div
                key={a.id}
                onClick={a.projeto_id ? () => navigate(`/projetos/${a.projeto_id}`) : undefined}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: i < arr.length - 1 ? '0 0 18px' : 0,
                  cursor: a.projeto_id ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: a.autor?.avatar_color ?? 'var(--fill)',
                    marginTop: 4,
                    flex: 'none',
                  }}
                />
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
                  <b style={{ color: 'var(--ink)' }}>{a.autor?.nome ?? '—'}</b> {a.payload.texto}
                  {a.projeto?.nome ? ` · ${a.projeto.nome}` : ''}{' '}
                  <span style={{ color: 'var(--faint)' }}>· {tempoRelativo(a.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
