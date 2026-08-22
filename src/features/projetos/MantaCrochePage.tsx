import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Lbl } from '../../components/ui/bits'
import { useToast } from '../../components/ui/Toast'
import { useGradeInterativa, type ModoGrade } from '../../components/ui/useGradeInterativa'
import { useZoomGrade } from '../../components/ui/ZoomGrade'
import { coordenada } from '../../lib/grade'
import { fmtMedida, tamanhoManta } from '../../lib/medida'
import { Comentarios, Historico } from './Comentarios'
import { ETAPA_COR, QuadroEtapas } from './QuadroEtapas'
import { AcoesProjeto, AvisoArquivado, ProgressoProjeto } from './CabecalhoProjeto'
import { IconChevron } from '../../components/ui/icons'
import { SquareGranny, coresDoModelo } from '../../components/ui/SquareGranny'
import {
  ETAPA_LABEL,
  fetchModelos,
  fetchSquares,
  pintarSquares,
  progressoSquares,
  trocarSquares,
  type MantaModelo,
  type Projeto,
  type Square,
} from './api'

/* O mapa é o desenho da manta: onde cada padrão fica e como a peça se encaixa
   no todo. Quem anda com a produção é o quadro de etapas — misturar as duas
   coisas fazia a mesma peça ser editável de dois jeitos diferentes. */
const MODOS: [ModoGrade, string, string][] = [
  ['mover', 'Mover', 'arraste um square sobre outro para trocarem de lugar'],
  ['pintar', 'Pintar', 'escolha um padrão e arraste pela grade'],
]

/* Vista e ferramenta eram duas fileiras da mesma pílula preenchida em cor de
   marca — dois níveis diferentes com o mesmo peso. Agora as duas são
   segmentadas (escolher não é agir), e a ferramenta vem menor, subordinada. */
const seg = (on: boolean, miudo = false): CSSProperties => ({
  padding: miudo ? '5px 12px' : '7px 16px',
  borderRadius: 99,
  fontSize: miudo ? 12 : 12.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  border: '1px solid var(--field-border)',
  background: on ? 'var(--chip-soft)' : 'transparent',
  color: on ? 'var(--primary-dark)' : 'var(--muted)',
  fontWeight: on ? 800 : 700,
  fontFamily: 'inherit',
  transition: 'background var(--dur-rapida) var(--ease-saida), color var(--dur-rapida)',
})

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
  const { can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()

  const [modo, setModo] = useState<ModoGrade>('mover')
  const [pincel, setPincel] = useState<string>(modelos[0]?.id ?? '')
  const zoom = useZoomGrade(46)

  const porPosicao = useMemo(() => new Map(squares.map((s) => [s.posicao, s])), [squares])
  const porModelo = useMemo(() => new Map(modelos.map((m) => [m.id, m])), [modelos])

  /* Qual célula do mapa está pronta não quer dizer nada: quem faz um square pega
     "um do padrão A", não a peça da terceira linha. O mapa mostra então a mesma
     quantidade que o quadro diz estar pronta, preenchendo de cima para baixo. */
  const prontas = useMemo(() => {
    const faltam = new Map<string, number>()
    for (const s of squares) {
      if (s.etapa === 'pronto') faltam.set(s.modelo_id, (faltam.get(s.modelo_id) ?? 0) + 1)
    }
    const set = new Set<number>()
    for (const s of [...squares].sort((a, b) => a.posicao - b.posicao)) {
      const n = faltam.get(s.modelo_id) ?? 0
      if (n > 0) {
        set.add(s.posicao)
        faltam.set(s.modelo_id, n - 1)
      }
    }
    return set
  }, [squares])

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['squares', projeto.id] })
    qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
    qc.invalidateQueries({ queryKey: ['progresso-geral'] })
  }

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

  const { sel, arrastado, alvo, aoClicar, propsGrade } = useGradeInterativa({
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
        <span className="lbl" style={{ marginRight: 2 }}>
          FERRAMENTA
        </span>
        {MODOS.map(([m, label]) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            style={seg(modo === m, true)}
            disabled={!podeEditar}
          >
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
              <SquareGranny cores={coresDoModelo(m)} tamanho={22} radius={3} style={{ flex: 'none' }} />
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
              const feito = prontas.has(pos)
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
                    background: 'var(--sand)',
                    opacity: ehArrastado ? 0.35 : feito ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    cursor: podeEditar ? (modo === 'mover' ? 'grab' : 'pointer') : 'default',
                    /* a seleção precisa saltar por cima da própria cor do
                       padrão: um contorno fino sumia dentro da grade */
                    outline: naSelecao
                      ? '3px solid var(--ink)'
                      : ehAlvo
                        ? '2px dashed var(--primary)'
                        : 'none',
                    outlineOffset: -1,
                    boxShadow: naSelecao ? '0 0 0 2px var(--card), 0 2px 8px rgba(0,0,0,.25)' : undefined,
                    transform: ehAlvo ? 'scale(1.14)' : 'scale(1)',
                    zIndex: ehAlvo || naSelecao ? 1 : 0,
                    transition:
                      'transform var(--dur-media) var(--ease-mola), opacity var(--dur-rapida)',
                  }}
                >
                  {m && <SquareGranny cores={coresDoModelo(m)} tamanho={zoom.celula} />}
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
                    <SquareGranny cores={coresDoModelo(m)} tamanho={12} />
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
              <Lbl style={{ marginBottom: 8 }}>PEÇA ESCOLHIDA</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SquareGranny
                  cores={coresDoModelo(modeloSel)}
                  tamanho={40}
                  style={{ flex: 'none' }}
                />
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


    </>
  )
}

/* ---------- Página ---------- */

export function MantaCrochePage({ projeto }: { projeto: Projeto }) {
  const navigate = useNavigate()
  // o quadro abre primeiro: é onde a produção anda; o mapa é o desenho da manta
  const [view, setView] = useState<'mapa' | 'etapas'>('etapas')

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
        <div className="h titulo-pagina">{projeto.nome}</div>
        <span
          className="tag"
          style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
        >
          CROCHÊ
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <AcoesProjeto projeto={projeto} />
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        {projeto.destino ? `Destino: ${projeto.destino} · ` : ''}
        {prog.total} squares{letras ? ` · padrões ${letras}` : ''}
        {tamanho ? ` · ${fmtMedida(tamanho)}` : ''}
      </div>
      <AvisoArquivado projeto={projeto} />
      <ProgressoProjeto done={prog.done} total={prog.total} unidade="squares" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={() => setView('etapas')} style={seg(view === 'etapas')}>
          Quadro de etapas
        </button>
        <button onClick={() => setView('mapa')} style={seg(view === 'mapa')}>
          Mapa de montagem
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
        <QuadroEtapas projeto={projeto} squares={lista} modelos={modelos ?? []} />
      )}
      <div className="pgrid" style={{ '--cols': '1fr 1fr', '--gap': '24px' } as CSSProperties}>
        <Comentarios projetoId={projeto.id} />
        <Historico projetoId={projeto.id} titulo="Histórico de alterações" />
      </div>
    </div>
  )
}
