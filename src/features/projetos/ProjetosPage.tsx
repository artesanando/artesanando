import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { Progress } from '../../components/ui/bits'
import {
  fetchProgressoGeral,
  fetchProjetos,
  progressoFaixas,
  progressoSquares,
  progressoUnidades,
  type Projeto,
} from './api'

type Aba = 'todos' | 'mantas' | 'amigurumis'

export function ProjetosPage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()
  const [aba, setAba] = useState<Aba>('todos')

  const { data: projetos, isLoading, isError } = useQuery({
    queryKey: ['projetos'],
    queryFn: fetchProjetos,
  })
  const { data: prog } = useQuery({ queryKey: ['progresso-geral'], queryFn: fetchProgressoGeral })

  const todos = projetos ?? []
  const mantas = todos.filter((p) => p.tipo !== 'amigurumi')
  const amigurumis = todos.filter((p) => p.tipo === 'amigurumi')

  const progressoDe = (p: Projeto): { done: number; total: number } => {
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

  const pct = ({ done, total }: { done: number; total: number }) =>
    total === 0 ? 0 : Math.round((done / total) * 100)

  const tabStyle = (on: boolean) =>
    on
      ? { padding: '8px 2px', borderBottom: '2px solid var(--primary)', cursor: 'pointer' }
      : { padding: '8px 2px', color: 'var(--muted)', cursor: 'pointer' }

  const mostraMantas = aba !== 'amigurumis'
  const mostraAmigs = aba !== 'mantas'

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
              Projetos
            </div>
            <div
              className="field"
              style={{
                borderRadius: 99,
                padding: '6px 14px',
                fontWeight: 800,
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              2026.2
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
            {mantas.length} mantas · {amigurumis.length} tipos de amigurumi
          </div>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('projeto')}>
            + Novo projeto
          </button>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 22,
          borderBottom: '1px solid var(--border-strong)',
          marginBottom: 18,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <div onClick={() => setAba('todos')} style={tabStyle(aba === 'todos')}>
          Todos
        </div>
        <div onClick={() => setAba('mantas')} style={tabStyle(aba === 'mantas')}>
          Mantas <span style={{ color: 'var(--green-dark)' }}>{mantas.length}</span>
        </div>
        <div onClick={() => setAba('amigurumis')} style={tabStyle(aba === 'amigurumis')}>
          Amigurumis <span style={{ color: 'var(--amber)' }}>{amigurumis.length}</span>
        </div>
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {isError && (
        <div style={{ fontSize: 13, color: 'var(--accent)' }}>
          Não foi possível carregar os projetos. Recarregue a página.
        </div>
      )}
      {mostraMantas && mantas.length > 0 && (
        <>
          <div className="lbl" style={{ marginBottom: 10 }}>
            MANTAS
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 26 }}
          >
            {mantas.map((p) => {
              const pr = progressoDe(p)
              const croche = p.tipo === 'manta_croche'
              return (
                <div
                  key={p.id}
                  className="card"
                  onClick={() => navigate(`/projetos/${p.id}`)}
                  style={{ padding: '16px 18px', cursor: 'pointer' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {p.nome}{' '}
                      <span
                        className="tag"
                        style={{
                          background: croche ? 'var(--chip-rose)' : 'var(--chip-green)',
                          color: croche ? 'var(--accent)' : 'var(--green-dark)',
                          marginLeft: 4,
                        }}
                      >
                        {croche ? 'crochê' : 'tricô'}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                      {pr.done}/{pr.total}
                    </span>
                  </div>
                  <Progress pct={`${pct(pr)}%`} />
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--muted)',
                      fontWeight: 600,
                      marginTop: 8,
                    }}
                  >
                    {croche ? `${pr.total} squares` : `${pr.total} faixas`}
                    {p.destino ? ` · destino: ${p.destino}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      {mostraAmigs && amigurumis.length > 0 && (
        <>
          <div className="lbl" style={{ marginBottom: 10 }}>
            AMIGURUMIS · por tipo
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {amigurumis.map((p) => {
              const pr = progressoDe(p)
              const percent = pct(pr)
              const entregue = p.status === 'entregue'
              return (
                <div
                  key={p.id}
                  className="card"
                  onClick={() => navigate(`/projetos/${p.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.7fr 1.3fr 1.4fr .5fr',
                    gap: 14,
                    alignItems: 'center',
                    padding: '14px 18px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: `repeating-linear-gradient(-45deg,#F6E4E6 0 6px,#F6E4E6CC 6px 12px)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 17,
                      }}
                    >
                      {p.emoji ?? '🧶'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                        {p.destino ?? ''}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {pr.done} und{' '}
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
                        · meta {p.meta ?? pr.total}
                      </span>
                    </div>
                    <Progress
                      pct={`${percent}%`}
                      style={{ height: 5, marginTop: 6 }}
                      fillStyle={percent >= 100 ? { background: 'var(--green)' } : undefined}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }} />
                  {entregue ? (
                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="tag"
                        style={{
                          border: '1px solid var(--chip-green-border)',
                          color: 'var(--green-dark)',
                        }}
                      >
                        ENTREGUE
                      </span>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right', color: 'var(--faint-3)' }}>›</div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
