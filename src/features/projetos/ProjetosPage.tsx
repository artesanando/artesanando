import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { Progress } from '../../components/ui/bits'
import { MenuKebab } from '../../components/ui/controles'
import { useAcoesProjeto } from './useAcoesProjeto'
import { separaArquivados } from '../../lib/arquivo'
import { useLabelSemestre } from '../../lib/semestre'
import { IconAmigurumi, IconCroche, IconTrico } from '../../components/ui/icons'
import { CabecalhoPagina } from '../../components/layout/CabecalhoPagina'
import {
  fetchProgressoGeral,
  fetchProjetos,
  progressoFaixas,
  progressoSquares,
  progressoUnidades,
  type Projeto,
  type ProjetoTipo,
} from './api'

type Aba = 'todos' | 'mantas' | 'amigurumis' | 'arquivados'

export function ProjetosPage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()
  const [aba, setAba] = useState<Aba>('todos')
  const semestre = useLabelSemestre()
  const acoesProjeto = useAcoesProjeto()

  const {
    data: projetos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['projetos'],
    queryFn: fetchProjetos,
  })
  const { data: prog } = useQuery({ queryKey: ['progresso-geral'], queryFn: fetchProgressoGeral })

  const { ativos, arquivados } = separaArquivados(projetos ?? [])
  /* Os contadores das abas e o subtítulo falam sempre do que está ativo. Saíam
     do conjunto da aba, então abrir "Arquivados" fazia o cabeçalho dizer
     "1 manta" com um projeto de outro semestre na tela. */
  const mantasAtivas = ativos.filter((p) => p.tipo !== 'amigurumi')
  const amigsAtivos = ativos.filter((p) => p.tipo === 'amigurumi')

  const todos = aba === 'arquivados' ? arquivados : ativos
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

  const mostraMantas = aba !== 'amigurumis'
  const mostraAmigs = aba !== 'mantas'

  return (
    <div className="pagina">
      <CabecalhoPagina
        titulo="Projetos"
        sub={`${semestre} · ${plural(mantasAtivas.length, 'manta', 'mantas')} · ${plural(
          amigsAtivos.length,
          'tipo de amigurumi',
          'tipos de amigurumi',
        )}`}
        acoes={
          isAdmin && (
            <button className="pill" onClick={() => open('projeto')}>
              + Novo projeto
            </button>
          )
        }
      />
      {/* eram <div onClick>: sem foco, sem teclado e sem estado para leitor de tela */}
      <div
        role="tablist"
        aria-label="Filtrar projetos"
        style={{
          display: 'flex',
          gap: 22,
          borderBottom: '1px solid var(--border-strong)',
          marginBottom: 18,
        }}
      >
        {(
          [
            ['todos', 'Todos', null, null],
            ['mantas', 'Mantas', mantasAtivas.length, 'var(--green-dark)'],
            ['amigurumis', 'Amigurumis', amigsAtivos.length, 'var(--amber)'],
            ...(arquivados.length > 0
              ? [['arquivados', 'Arquivados', arquivados.length, 'var(--faint)'] as const]
              : []),
          ] as [Aba, string, number | null, string | null][]
        ).map(([k, label, n, cor]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={aba === k}
            onClick={() => setAba(k)}
            className="aba"
          >
            {label}
            {n !== null && <span style={{ color: cor ?? undefined }}> {n}</span>}
          </button>
        ))}
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {isError && (
        <div style={{ fontSize: 13, color: 'var(--accent)' }}>
          Não foi possível carregar os projetos. Recarregue a página.
        </div>
      )}
      {!isLoading && !isError && mantas.length === 0 && amigurumis.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 0' }}>
          {aba === 'arquivados'
            ? 'Nenhum projeto arquivado.'
            : aba === 'mantas'
              ? 'Nenhuma manta em produção.'
              : aba === 'amigurumis'
                ? 'Nenhum tipo de amigurumi em produção.'
                : 'Nenhum projeto ainda.'}
        </div>
      )}
      {mostraMantas && mantas.length > 0 && (
        <>
          <div className="lbl" style={{ marginBottom: 10 }}>
            MANTAS
          </div>
          <div
            className="pgrid"
            style={
              { '--cols': '1fr 1fr', '--gap': '12px', marginBottom: 26 } as React.CSSProperties
            }
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
                      <SeloArquivado projeto={p} />
                    </div>
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        {pr.done}/{pr.total}
                      </span>
                      <MenuKebab ariaLabel={`Ações de ${p.nome}`} acoes={acoesProjeto(p)} />
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
                  className="card cartao-amig"
                  onClick={() => navigate(`/projetos/${p.id}`)}
                  style={{
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
                        color: 'var(--accent)',
                      }}
                    >
                      {iconeDoTipo(p.tipo)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                        {p.destino ?? ''}
                      </div>
                      <SeloArquivado projeto={p} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {pr.done}
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
                        /{p.meta ?? pr.total} unidades
                      </span>
                    </div>
                    <Progress
                      pct={`${percent}%`}
                      style={{ height: 5, marginTop: 6 }}
                      fillStyle={percent >= 100 ? { background: 'var(--green)' } : undefined}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                    {entregue && (
                      <span
                        className="tag"
                        style={{
                          border: '1px solid var(--chip-green-border)',
                          color: 'var(--green-dark)',
                        }}
                      >
                        ENTREGUE
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <MenuKebab ariaLabel={`Ações de ${p.nome}`} acoes={acoesProjeto(p)} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* Na aba de arquivados o cartão era igualzinho a um ativo: mesma barra em cor
   de destaque, sem dizer que estava fora do ar nem de que semestre veio. */
function SeloArquivado({ projeto }: { projeto: Projeto }) {
  if (!projeto.arquivado_em) return null
  return (
    <span
      className="tag"
      style={{ background: 'var(--chip-soft)', color: 'var(--muted)', marginLeft: 4 }}
    >
      ARQUIVADO
    </span>
  )
}

/** "1 manta" / "2 mantas" — o cabeçalho escrevia "1 mantas" */
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

const iconeDoTipo = (tipo: ProjetoTipo) =>
  tipo === 'manta_croche' ? (
    <IconCroche />
  ) : tipo === 'manta_trico' ? (
    <IconTrico />
  ) : (
    <IconAmigurumi />
  )
