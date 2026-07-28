import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Lbl, Progress } from '../../components/ui/bits'
import { Comentarios, Historico } from './Comentarios'
import {
  fetchLotes,
  fetchModelos,
  fetchSquares,
  pegarLote,
  progressoSquares,
  type Lote,
  type LoteEtapa,
  type MantaModelo,
  type Projeto,
  type Square,
} from './api'

const seg = (on: boolean): CSSProperties =>
  on
    ? {
        padding: '7px 16px',
        borderRadius: 99,
        background: 'var(--primary)',
        color: '#fff',
        fontWeight: 800,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        padding: '7px 16px',
        borderRadius: 99,
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }

const COL_META: Record<LoteEtapa, { titulo: string; bg: string; cor: string }> = {
  miolo: { titulo: 'MIOLO', bg: '#F4EEE9', cor: 'var(--muted)' },
  aguardando_borda: { titulo: 'AGUARDANDO BORDA', bg: '#FBF1E7', cor: 'var(--gold-dark)' },
  borda: { titulo: 'BORDA', bg: '#F4EEE9', cor: 'var(--muted)' },
  pronto: { titulo: 'PRONTO', bg: '#EEF3EA', cor: 'var(--green-dark)' },
}

function Fluxo({
  projeto,
  lotes,
  modelos,
  squares,
}: {
  projeto: Projeto
  lotes: Lote[]
  modelos: MantaModelo[]
  squares: Square[]
}) {
  const { profile } = useAuth()
  const qc = useQueryClient()

  const pegar = useMutation({
    mutationFn: (lote: Lote) => pegarLote(lote, profile!.id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['lotes', projeto.id] })
      qc.invalidateQueries({ queryKey: ['squares', projeto.id] })
      qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
    },
  })

  const loteCard = (l: Lote) => (
    <div
      key={l.id}
      className="card"
      style={{
        padding: '11px 12px',
        marginBottom: 8,
        borderColor: l.etapa === 'aguardando_borda' ? '#E7D6B8' : undefined,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 13 }}>
        Modelo {l.modelo?.letra ?? '?'} ×{l.quantidade}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
        {l.responsavel?.nome ?? l.obs ?? '—'}
      </div>
      {!l.responsavel_id && l.etapa === 'aguardando_borda' && (
        <div
          onClick={() => pegar.mutate(l)}
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'var(--gold-dark)',
            marginTop: 6,
            cursor: 'pointer',
          }}
        >
          ↳ precisa de alguém · <span style={{ textDecoration: 'underline' }}>Pegar lote</span>
        </div>
      )}
    </div>
  )

  const prontosPorModelo = modelos
    .map((m) => ({
      modelo: m,
      prontos: squares.filter((s) => s.modelo_id === m.id && s.etapa === 'pronto').length,
    }))
    .filter((x) => x.prontos > 0)

  const coluna = (etapa: LoteEtapa, conteudo: ReactNode, n: number) => {
    const meta = COL_META[etapa]
    return (
      <div style={{ background: meta.bg, borderRadius: 14, padding: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            fontWeight: 800,
            color: meta.cor,
            marginBottom: 10,
          }}
        >
          <span>{meta.titulo}</span>
          <span>{n}</span>
        </div>
        {conteudo}
      </div>
    )
  }

  const dos = (etapa: LoteEtapa) => lotes.filter((l) => l.etapa === etapa)

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        miolo → aguardando borda → borda → pronto · o lote "precisa de alguém" fica livre para
        outra integrante pegar
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 26 }}
      >
        {coluna('miolo', dos('miolo').map(loteCard), dos('miolo').length)}
        {coluna(
          'aguardando_borda',
          dos('aguardando_borda').map(loteCard),
          dos('aguardando_borda').length,
        )}
        {coluna('borda', dos('borda').map(loteCard), dos('borda').length)}
        {coluna(
          'pronto',
          prontosPorModelo.map(({ modelo, prontos }) => (
            <div
              key={modelo.id}
              className="card"
              style={{ padding: '11px 12px', marginBottom: 8, borderColor: '#D8E0D2' }}
            >
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                Modelo {modelo.letra} ×{prontos}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--green-dark)',
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                ✓ {modelo.responsavel?.nome ?? 'concluídos'}
              </div>
            </div>
          )),
          prontosPorModelo.length,
        )}
      </div>
    </>
  )
}

function Mapa({
  squares,
  modelos,
}: {
  squares: Square[]
  modelos: MantaModelo[]
}) {
  const [selPos, setSelPos] = useState(26)
  const porId = Object.fromEntries(modelos.map((m) => [m.id, m]))
  const sel = squares.find((s) => s.posicao === selPos) ?? squares[0]
  const selModelo = sel ? porId[sel.modelo_id] : undefined
  const cols = 10
  const selCol = sel ? `L${Math.floor(sel.posicao / cols) + 1} C${(sel.posicao % cols) + 1}` : ''

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        Cada quadrinho é um granny da manta — a cor de fora é a borda, a de dentro o miolo. Toque
        para ver o padrão. Esmaecidos ainda não foram feitos.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 26,
          alignItems: 'start',
          marginBottom: 26,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},30px)`, gap: 3 }}>
          {squares.map((sq) => {
            const m = porId[sq.modelo_id]
            const done = sq.etapa === 'pronto'
            return (
              <div
                key={sq.id}
                onClick={() => setSelPos(sq.posicao)}
                title={`square ${sq.posicao}`}
                style={{
                  width: 30,
                  height: 30,
                  background: m?.cor_borda ?? '#ccc',
                  opacity: done ? 1 : 0.38,
                  boxShadow: sq.posicao === selPos ? '0 0 0 2px var(--ink)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                <div style={{ width: 16, height: 16, background: m?.cor_miolo ?? '#eee' }} />
              </div>
            )
          })}
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="h" style={{ fontSize: 15, marginBottom: 10 }}>
            Padrões
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }}>
            {modelos.map((m) => {
              const doModelo = squares.filter((s) => s.modelo_id === m.id)
              const done = doModelo.filter((s) => s.etapa === 'pronto').length
              const full = done === doModelo.length && doModelo.length > 0
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 2px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{ width: 10, height: 10, borderRadius: 2, background: m.cor_borda }}
                    />
                    {m.nome.split('—')[0].trim()}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: full ? 'var(--green-dark)' : 'var(--accent)',
                    }}
                  >
                    {done}/{doModelo.length}
                    {full ? ' ✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>
          {sel && selModelo && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--card)',
                padding: '12px 14px',
              }}
            >
              <Lbl style={{ marginBottom: 8 }}>SELECIONADO · {selCol}</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: selModelo.cor_borda,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <div style={{ width: 22, height: 22, background: selModelo.cor_miolo }} />
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  <b>{selModelo.nome}</b>
                  <br />
                  <span style={{ color: 'var(--muted)' }}>miolo + borda</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function MantaCrochePage({ projeto }: { projeto: Projeto }) {
  const { isAdmin, openProducao } = useStore()
  const navigate = useNavigate()
  const [view, setView] = useState<'fluxo' | 'mapa'>('fluxo')

  const { data: modelos } = useQuery({
    queryKey: ['modelos', projeto.id],
    queryFn: () => fetchModelos(projeto.id),
  })
  const { data: squares } = useQuery({
    queryKey: ['squares', projeto.id],
    queryFn: () => fetchSquares(projeto.id),
  })
  const { data: lotes } = useQuery({
    queryKey: ['lotes', projeto.id],
    queryFn: () => fetchLotes(projeto.id),
  })

  const prog = progressoSquares(squares ?? [])
  const pct = prog.total === 0 ? 0 : Math.round((prog.done / prog.total) * 100)
  const letras = (modelos ?? []).map((m) => m.letra).join('/')

  return (
    <div style={{ padding: '26px 40px 34px' }}>
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        ‹ Projetos / <span style={{ color: 'var(--ink)' }}>{projeto.nome}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="h" style={{ fontWeight: 500, fontSize: 26 }}>
            {projeto.nome}
          </div>
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
          >
            CROCHÊ
          </span>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => openProducao(projeto.id)}>
            + Registrar produção
          </button>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        {projeto.destino ? `Destino: ${projeto.destino} · ` : ''}
        {prog.total} squares{letras ? ` · padrões ${letras}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <Progress pct={`${pct}%`} style={{ flex: 1, height: 8 }} />
        <div className="h" style={{ fontSize: 19, color: 'var(--accent)', flex: 'none' }}>
          {prog.done}
          <span style={{ color: 'var(--faint)', fontSize: 14 }}>/{prog.total} squares</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div onClick={() => setView('fluxo')} style={seg(view === 'fluxo')}>
          Fluxo por etapa
        </div>
        <div onClick={() => setView('mapa')} style={seg(view === 'mapa')}>
          Mapa de montagem
        </div>
      </div>
      {view === 'fluxo' ? (
        <Fluxo
          projeto={projeto}
          lotes={lotes ?? []}
          modelos={modelos ?? []}
          squares={squares ?? []}
        />
      ) : (
        <Mapa squares={squares ?? []} modelos={modelos ?? []} />
      )}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}
      >
        <Comentarios projetoId={projeto.id} />
        <Historico projetoId={projeto.id} titulo="Histórico de alterações" />
      </div>
    </div>
  )
}
