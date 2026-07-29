import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'
import { ini } from '../../lib/format'
import { Comentarios, Historico } from './Comentarios'
import { fetchFaixas, progressoFaixas, salvarFaixas, type Faixa, type Projeto } from './api'

const NOMES_COR: Record<string, string> = {
  '#ECD97C': 'Manteiga',
  '#A9BFA3': 'Verde',
  '#DFA2AC': 'Rosé',
}

/* editor com estado local inicializado uma vez a partir da query —
   a gravação acontece só no Salvar (risco nº 3 do plano) */
function Editor({ projeto, faixas }: { projeto: Projeto; faixas: Faixa[] }) {
  const { can, isAdmin, profile } = useAuth()
  const qc = useQueryClient()
  const [rows, setRows] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(faixas.map((f) => [f.id, f.cores])),
  )
  const [sel, setSel] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)

  const faixaSel = faixas[sel]
  const coresSel = rows[faixaSel.id] ?? faixaSel.cores
  const podeReabrir = isAdmin || faixaSel.responsavel_id === profile?.id
  const feita = faixaSel.status === 'feita' && !podeReabrir

  const prog = progressoFaixas(faixas)
  const pctStr = `${prog.total === 0 ? 0 : Math.round((prog.done / prog.total) * 100)}%`

  const setCores = (faixaId: string, cores: string[]) =>
    setRows((r) => ({ ...r, [faixaId]: cores }))

  const moveCell = (from: number, to: number) => {
    if (feita || to < 0 || to >= coresSel.length) return
    const arr = coresSel.slice()
    const [x] = arr.splice(from, 1)
    arr.splice(to, 0, x)
    setCores(faixaSel.id, arr)
  }

  const shuffle = () => {
    if (feita) return
    const arr = coresSel.slice()
    for (let k = arr.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1))
      ;[arr[k], arr[j]] = [arr[j], arr[k]]
    }
    setCores(faixaSel.id, arr)
  }

  const salvar = useMutation({
    mutationFn: () => {
      const mudadas = faixas
        .filter((f) => f.status !== 'feita' || isAdmin || f.responsavel_id === profile?.id)
        .filter((f) => JSON.stringify(rows[f.id]) !== JSON.stringify(f.cores))
        .map((f) => ({ id: f.id, cores: rows[f.id] }))
      return salvarFaixas(mudadas)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faixas', projeto.id] })
      setFeedback('Ordem salva ✓')
    },
    onError: () => setFeedback('Não foi possível salvar.'),
  })

  return (
    <div className="pgrid" style={{ '--cols': '1.35fr 1fr', '--gap': '36px' } as React.CSSProperties}>
      <div>
        <div className="h" style={{ fontSize: 16, marginBottom: 4 }}>
          Prévia da manta
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 14 }}>
          toque numa faixa para reordenar as cores dela
        </div>
        <div
          style={{
            border: '1.5px solid #D8C7BF',
            borderRadius: 8,
            overflow: 'hidden',
            maxWidth: 360,
          }}
        >
          {faixas.map((f, i) => {
            const isSel = i === sel
            const cores = rows[f.id] ?? f.cores
            const op = isSel ? 1 : f.status === 'afazer' ? 0.42 : 1
            return (
              <div
                key={f.id}
                onClick={() => setSel(i)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  height: 34,
                  cursor: 'pointer',
                  opacity: op,
                  boxShadow: isSel ? 'inset 0 0 0 2px var(--ink)' : 'none',
                  zIndex: isSel ? 1 : 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 7,
                    top: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,.45)',
                  }}
                >
                  F{f.ordem}
                </div>
                {cores.map((c, j) => (
                  <div key={j} style={{ flex: 1, background: c }} />
                ))}
              </div>
            )
          })}
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, maxWidth: 360 }}
        >
          <Progress pct={pctStr} style={{ flex: 1, height: 7 }} />
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
            {prog.done}/{prog.total}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--muted)',
            marginTop: 9,
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          Mesma paleta em toda faixa — só muda a ordem. Faixas claras ainda não foram tricotadas.
        </div>
      </div>
      <div
        style={{
          background: 'var(--sand-soft)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <div className="h" style={{ fontSize: 17 }}>
            Faixa {faixaSel.ordem}
          </div>
          <span
            className="tag"
            style={
              feita
                ? { background: 'var(--chip-green)', color: 'var(--green-dark)' }
                : { background: 'var(--chip-rose)', color: 'var(--accent)' }
            }
          >
            {feita ? 'FEITA · SOMENTE LEITURA' : 'EDITANDO'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Avatar color={faixaSel.responsavel?.avatar_color ?? 'var(--fill)'} size={22} fontSize={9}>
            {ini(faixaSel.responsavel?.nome ?? '?')}
          </Avatar>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>
            {faixaSel.responsavel?.nome ?? 'Sem responsável'}
          </span>
        </div>
        <Lbl style={{ marginBottom: 10 }}>ORDEM DAS CORES</Lbl>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {coresSel.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                background: 'var(--card)',
                border: '1px solid #E7D9D2',
                borderRadius: 10,
                padding: '7px 11px',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--faint-2)',
                  width: 12,
                  flex: 'none',
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: c,
                  border: '1px solid rgba(59,52,47,.12)',
                  flex: 'none',
                }}
              />
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>
                {NOMES_COR[c] ?? 'Cor'}
              </span>
              <span
                onClick={() => moveCell(i, i - 1)}
                style={{
                  cursor: feita ? 'default' : 'pointer',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 13,
                  opacity: feita || i === 0 ? 0.22 : 1,
                  padding: '2px 4px',
                }}
              >
                ▲
              </span>
              <span
                onClick={() => moveCell(i, i + 1)}
                style={{
                  cursor: feita ? 'default' : 'pointer',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 13,
                  opacity: feita || i === coresSel.length - 1 ? 0.22 : 1,
                  padding: '2px 4px',
                }}
              >
                ▼
              </span>
            </div>
          ))}
        </div>
        {feedback && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: feedback.includes('✓') ? 'var(--green-dark)' : 'var(--accent)',
              marginTop: 12,
            }}
          >
            {feedback}
          </div>
        )}
        <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
          <button
            className="pill"
            style={{ flex: 1, padding: 10, opacity: feita ? 0.5 : 1 }}
            onClick={shuffle}
            disabled={feita}
          >
            Embaralhar ordem
          </button>
          {can('progresso') && (
            <button
              className="pill ghost"
              style={{ padding: '10px 16px' }}
              onClick={() => salvar.mutate()}
              disabled={salvar.isPending}
            >
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function MantaTricoPage({ projeto }: { projeto: Projeto }) {
  const navigate = useNavigate()
  const { data: faixas, isLoading } = useQuery({
    queryKey: ['faixas', projeto.id],
    queryFn: () => fetchFaixas(projeto.id),
  })

  const prog = progressoFaixas(faixas ?? [])

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
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            TRICÔ
          </span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>
          {prog.done}/{prog.total} faixas
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Ponto arroz · agulha 5mm · cada faixa é uma linha inteira, feita por uma integrante
      </div>
      {isLoading && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>}
      {faixas && faixas.length > 0 && <Editor projeto={projeto} faixas={faixas} />}
      <div
        className="pgrid"
        style={
          {
            '--cols': '1.35fr 1fr',
            '--gap': '36px',
            marginTop: 30,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          } as React.CSSProperties
        }
      >
        <Comentarios projetoId={projeto.id} />
        <Historico projetoId={projeto.id} />
      </div>
    </div>
  )
}
