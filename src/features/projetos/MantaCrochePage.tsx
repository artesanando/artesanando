import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Lbl, Progress } from '../../components/ui/bits'
import { Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useGradeInterativa, type ModoGrade } from '../../components/ui/useGradeInterativa'
import { useZoomGrade } from '../../components/ui/ZoomGrade'
import { coordenada } from '../../lib/grade'
import { fmtMedida, tamanhoManta } from '../../lib/medida'
import { Comentarios, Historico } from './Comentarios'
import { IconChevron } from '../../components/ui/icons'
import {
  ETAPAS,
  ETAPA_LABEL,
  fetchIntegrantesAtivas,
  fetchModelos,
  fetchSquares,
  marcarSquares,
  pintarSquares,
  progressoSquares,
  resumoPorEtapa,
  trocarSquares,
  type MantaModelo,
  type Projeto,
  type Square,
  type SquareEtapa,
} from './api'

const MODOS: [ModoGrade, string, string][] = [
  ['marcar', 'Marcar', 'selecione squares e diga em que etapa estão'],
  ['mover', 'Mover', 'arraste um square sobre outro para trocarem de lugar'],
  ['pintar', 'Pintar', 'escolha um modelo e arraste pela grade'],
]

const seg = (on: boolean): CSSProperties => ({
  padding: '7px 16px',
  borderRadius: 99,
  fontSize: 12.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: on ? '1px solid var(--primary)' : '1px solid var(--field-border)',
  background: on ? 'var(--primary)' : 'transparent',
  color: on ? '#fff' : 'var(--ink-soft)',
  fontWeight: on ? 800 : 700,
  fontFamily: 'inherit',
  transition: 'background var(--dur-rapida) var(--ease-saida), color var(--dur-rapida)',
})

const ETAPA_COR: Record<SquareEtapa, string> = {
  afazer: 'var(--faint-2)',
  miolo: 'var(--blue-dark)',
  aguardando_borda: 'var(--gold-dark)',
  borda: 'var(--lilac)',
  pronto: 'var(--green-dark)',
}

/* ---------- Mapa ---------- */

function Mapa({
  projeto,
  squares,
  modelos,
  colunas,
}: {
  projeto: Projeto
  squares: Square[]
  modelos: MantaModelo[]
  colunas: number
}) {
  const { profile, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()

  const [modo, setModo] = useState<ModoGrade>('marcar')
  const [pincel, setPincel] = useState<string>(modelos[0]?.id ?? '')
  const [respId, setRespId] = useState('')
  const zoom = useZoomGrade()

  const { data: integrantes } = useQuery({
    queryKey: ['integrantes-min'],
    queryFn: fetchIntegrantesAtivas,
  })

  const porPosicao = useMemo(() => new Map(squares.map((s) => [s.posicao, s])), [squares])
  const porModelo = useMemo(() => new Map(modelos.map((m) => [m.id, m])), [modelos])

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['squares', projeto.id] })
    qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
    qc.invalidateQueries({ queryKey: ['progresso-geral'] })
  }

  const marcar = useMutation({
    mutationFn: (etapa: SquareEtapa) => {
      const ids = [...sel].map((p) => porPosicao.get(p)?.id).filter((x): x is string => !!x)
      const resp = (integrantes ?? []).find((p) => p.id === respId)
      return marcarSquares({
        projetoId: projeto.id,
        ids,
        etapa,
        responsavelId: respId || profile!.id,
        responsavelNome: resp?.nome ?? profile!.nome,
        autorId: profile!.id,
      })
    },
    onSuccess: () => {
      setSel(new Set())
      invalidar()
      toast('Progresso registrado')
    },
    onError: () => toast('Não foi possível registrar.', 'erro'),
  })

  const trocar = useMutation({
    mutationFn: ({ de, para }: { de: Square; para: Square }) => trocarSquares(de, para),
    onSuccess: invalidar,
    onError: () => toast('Não foi possível trocar os squares.', 'erro'),
  })

  const pintar = useMutation({
    mutationFn: (posicoes: number[]) => {
      const ids = posicoes.map((p) => porPosicao.get(p)?.id).filter((x): x is string => !!x)
      return pintarSquares(ids, pincel)
    },
    onSuccess: invalidar,
    onError: () => toast('Não foi possível pintar.', 'erro'),
  })

  const podeEditar = can('progresso')

  const { sel, setSel, arrastado, alvo, aoClicar, propsGrade } = useGradeInterativa({
    colunas,
    modo,
    ativo: podeEditar,
    aoPintar: (posicoes) => pintar.mutate(posicoes),
    aoTrocar: (de, para) => {
      const a = porPosicao.get(de)
      const b = porPosicao.get(para)
      if (a && b) trocar.mutate({ de: a, para: b })
    },
  })

  const linhas = Math.ceil(squares.length / colunas)
  const selecionado = sel.size === 1 ? porPosicao.get([...sel][0]) : undefined
  const modeloSel = selecionado ? porModelo.get(selecionado.modelo_id) : undefined

  return (
    <>
      <div
        style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}
      >
        {MODOS.map(([m, label]) => (
          <button key={m} onClick={() => setModo(m)} style={seg(modo === m)} disabled={!podeEditar}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>{zoom.controles}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        {podeEditar
          ? MODOS.find(([m]) => m === modo)?.[2]
          : 'você não tem permissão para registrar progresso — fale com a administradora'}
      </div>

      {modo === 'pintar' && (
        <div
          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}
        >
          <span className="lbl">PINCEL</span>
          {modelos.map((m) => (
            <button
              key={m.id}
              onClick={() => setPincel(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                border: '1px solid var(--field-border)',
                borderRadius: 99,
                padding: '5px 12px 5px 6px',
                cursor: 'pointer',
                background: 'transparent',
                fontFamily: 'inherit',
                boxShadow: m.id === pincel ? '0 0 0 2px var(--ink)' : undefined,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: m.cor_borda,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 3,
                  flex: 'none',
                }}
              >
                <span style={{ width: 11, height: 11, background: m.cor_miolo }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{m.letra}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="pgrid"
        style={{ '--cols': 'auto 1fr', '--gap': '26px', marginBottom: 26 } as CSSProperties}
      >
        <div className="rolagem-grade">
          <div
            {...propsGrade}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${colunas}, ${zoom.celula}px)`,
              gap: 1,
              touchAction: 'none',
              width: 'max-content',
            }}
          >
            {Array.from({ length: linhas * colunas }, (_, pos) => {
              const sq = porPosicao.get(pos)
              const m = sq ? porModelo.get(sq.modelo_id) : undefined
              const feito = sq?.etapa === 'pronto'
              const naSelecao = sel.has(pos)
              const ehArrastado = arrastado === pos
              const ehAlvo = alvo === pos
              const { linha, coluna } = coordenada(pos, colunas)
              const descricao = `Square linha ${linha} coluna ${coluna}${
                sq ? ` · ${ETAPA_LABEL[sq.etapa]}` : ''
              }${m ? ` · modelo ${m.letra}` : ''}`
              return (
                <button
                  key={pos}
                  data-pos={pos}
                  type="button"
                  aria-label={descricao}
                  aria-pressed={naSelecao || ehArrastado}
                  title={descricao}
                  disabled={!podeEditar}
                  onClick={() => aoClicar(pos)}
                  style={{
                    width: zoom.celula,
                    height: zoom.celula,
                    padding: 0,
                    border: 'none',
                    background: m?.cor_borda ?? 'var(--sand)',
                    opacity: ehArrastado ? 0.35 : feito ? 1 : 0.42,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: podeEditar ? (modo === 'mover' ? 'grab' : 'pointer') : 'default',
                    outline: naSelecao
                      ? '2px solid var(--ink)'
                      : ehAlvo
                        ? '2px dashed var(--primary)'
                        : 'none',
                    outlineOffset: -2,
                    transform: ehAlvo ? 'scale(1.14)' : 'scale(1)',
                    zIndex: ehAlvo || naSelecao ? 1 : 0,
                    transition:
                      'transform var(--dur-media) var(--ease-mola), opacity var(--dur-rapida)',
                  }}
                >
                  <span
                    style={{
                      width: '53%',
                      height: '53%',
                      background: m?.cor_miolo ?? 'var(--card)',
                    }}
                  />
                </button>
              )
            })}
          </div>
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
                    style={{ fontWeight: 800, color: full ? 'var(--green-dark)' : 'var(--accent)' }}
                  >
                    {done}/{doModelo.length}
                    {full ? '' : ''}
                  </span>
                </div>
              )
            })}
          </div>

          {selecionado && modeloSel && (
            <div className="card" style={{ padding: '12px 14px' }}>
              <Lbl style={{ marginBottom: 8 }}>
                SELECIONADO · L{coordenada(selecionado.posicao, colunas).linha} C
                {coordenada(selecionado.posicao, colunas).coluna}
              </Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: modeloSel.cor_borda,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <div style={{ width: 22, height: 22, background: modeloSel.cor_miolo }} />
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                  <b>{modeloSel.nome}</b>
                  <br />
                  <span style={{ color: ETAPA_COR[selecionado.etapa], fontWeight: 700 }}>
                    {ETAPA_LABEL[selecionado.etapa]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modo === 'marcar' && sel.size > 0 && podeEditar && (
        <div
          className="card barra-acao"
          style={{ padding: '14px 16px', marginBottom: 26, borderColor: 'var(--chip-rose-border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13 }}>
              {sel.size} square{sel.size > 1 ? 's' : ''} selecionado{sel.size > 1 ? 's' : ''}
            </b>
            <div style={{ minWidth: 180, flex: 1 }}>
              <Select
                ariaLabel="Quem fez"
                value={respId}
                onChange={setRespId}
                options={[
                  ['', 'Quem fez… (eu)'],
                  ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
                ]}
              />
            </div>
            <button className="pill ghost" onClick={() => setSel(new Set())}>
              Limpar
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {ETAPAS.map((etapa) => (
              <button
                key={etapa}
                className="pill ghost"
                style={{ borderColor: ETAPA_COR[etapa], color: ETAPA_COR[etapa] }}
                disabled={marcar.isPending}
                onClick={() => marcar.mutate(etapa)}
              >
                {ETAPA_LABEL[etapa]}
              </button>
            ))}
          </div>
        </div>
      )}

    </>
  )
}

/* ---------- Panorama por etapa (substitui o kanban de lotes) ---------- */

function PorEtapa({ squares, modelos }: { squares: Square[]; modelos: MantaModelo[] }) {
  const resumo = resumoPorEtapa(squares, modelos)
  return (
    <>
      <div
        className="pgrid"
        style={{ '--cols': 'repeat(auto-fit,minmax(150px,1fr))', '--gap': '12px', marginBottom: 26 } as CSSProperties}
      >
        {resumo.map(({ etapa, total, porModelo }) => (
          <div key={etapa} style={{ background: 'var(--sand-soft)', borderRadius: 14, padding: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontWeight: 800,
                color: ETAPA_COR[etapa],
                marginBottom: 10,
              }}
            >
              <span>{ETAPA_LABEL[etapa].toUpperCase()}</span>
              <span>{total}</span>
            </div>
            {porModelo.length === 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>—</div>
            )}
            {porModelo.map((m) => (
              <div
                key={m.letra}
                className="card"
                style={{ padding: '9px 11px', marginBottom: 7, fontSize: 12.5 }}
              >
                <b>Modelo {m.letra}</b> ×{m.total}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Página ---------- */

export function MantaCrochePage({ projeto }: { projeto: Projeto }) {
  const navigate = useNavigate()
  const [view, setView] = useState<'mapa' | 'etapas'>('mapa')

  const { data: modelos } = useQuery({
    queryKey: ['modelos', projeto.id],
    queryFn: () => fetchModelos(projeto.id),
  })
  const { data: squares } = useQuery({
    queryKey: ['squares', projeto.id],
    queryFn: () => fetchSquares(projeto.id),
  })

  const lista = squares ?? []
  const prog = progressoSquares(lista)
  const pct = prog.total === 0 ? 0 : Math.round((prog.done / prog.total) * 100)
  const letras = (modelos ?? []).map((m) => m.letra).join('/')
  // mantas criadas antes da grade configurável não têm colunas gravadas
  const colunas = projeto.colunas ?? 10
  const tamanho = tamanhoManta('manta_croche', colunas, Math.ceil(lista.length / colunas), {
    largura: projeto.peca_largura_cm,
    altura: projeto.peca_altura_cm,
  })

  return (
    <div className="pagina">
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        <IconChevron size={11} para="esquerda" /> Projetos / <span style={{ color: 'var(--ink)' }}>{projeto.nome}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="h titulo-pagina">
          {projeto.nome}
        </div>
        <span
          className="tag"
          style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
        >
          CROCHÊ
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        {projeto.destino ? `Destino: ${projeto.destino} · ` : ''}
        {prog.total} squares{letras ? ` · padrões ${letras}` : ''}
        {tamanho ? ` · ${fmtMedida(tamanho)}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <Progress pct={`${pct}%`} style={{ flex: 1, height: 8 }} />
        <div className="h" style={{ fontSize: 19, color: 'var(--accent)', flex: 'none' }}>
          {prog.done}
          <span style={{ color: 'var(--faint)', fontSize: 14 }}>/{prog.total} squares</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={() => setView('mapa')} style={seg(view === 'mapa')}>
          Mapa de montagem
        </button>
        <button onClick={() => setView('etapas')} style={seg(view === 'etapas')}>
          Por etapa
        </button>
      </div>
      {view === 'mapa' ? (
        <Mapa
          projeto={projeto}
          squares={lista}
          modelos={modelos ?? []}
          colunas={colunas}
        />
      ) : (
        <PorEtapa squares={lista} modelos={modelos ?? []} />
      )}
      <div className="pgrid" style={{ '--cols': '1fr 1fr', '--gap': '24px' } as CSSProperties}>
        <Comentarios projetoId={projeto.id} />
        <Historico projetoId={projeto.id} titulo="Histórico de alterações" />
      </div>
    </div>
  )
}
