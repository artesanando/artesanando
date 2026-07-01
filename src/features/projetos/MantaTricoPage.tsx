import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { MT_ACOL, MT_NOMES, MT_RESP, MT_STATUS } from '../../mocks/data'
import { ini } from '../../lib/format'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'

export function MantaTricoPage() {
  const { isAdmin, mantaTRows: rows, moveCell, shuffleBand } = useStore()
  const navigate = useNavigate()
  const [sel, setSel] = useState(3)

  const doneCount = MT_STATUS.filter((x) => x === 'feita').length
  const prog = Math.round((doneCount / rows.length) * 100) + '%'

  return (
    <div style={{ padding: '26px 40px 34px' }}>
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        ‹ Projetos / <span style={{ color: 'var(--ink)' }}>Manta Nuvem</span>
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
            Manta Nuvem
          </div>
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            TRICÔ
          </span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)' }}>
          {doneCount}/{rows.length} faixas
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Ponto arroz · agulha 5mm · cada faixa é uma linha inteira, feita por uma integrante
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 36,
          alignItems: 'start',
        }}
      >
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
            {rows.map((r, i) => {
              const isSel = i === sel
              const op = isSel ? 1 : MT_STATUS[i] === 'afazer' ? 0.42 : 1
              return (
                <div
                  key={i}
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
                    F{i + 1}
                  </div>
                  {r.map((c, j) => (
                    <div key={j} style={{ flex: 1, background: c }} />
                  ))}
                </div>
              )
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 14,
              maxWidth: 360,
            }}
          >
            <Progress pct={prog} style={{ flex: 1, height: 7 }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
              {doneCount}/{rows.length}
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
              Faixa {sel + 1}
            </div>
            <span className="tag" style={{ background: 'var(--chip-rose)', color: 'var(--accent)' }}>
              EDITANDO
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Avatar color={MT_ACOL[sel]} size={22} fontSize={9}>
              {ini(MT_RESP[sel])}
            </Avatar>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{MT_RESP[sel]}</span>
          </div>
          <Lbl style={{ marginBottom: 10 }}>ORDEM DAS CORES</Lbl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows[sel].map((c, i) => (
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
                  {MT_NOMES[c] || 'Cor'}
                </span>
                <span
                  onClick={() => moveCell(sel, i, i - 1)}
                  style={{
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    fontWeight: 800,
                    fontSize: 13,
                    opacity: i === 0 ? 0.22 : 1,
                    padding: '2px 4px',
                  }}
                >
                  ▲
                </span>
                <span
                  onClick={() => moveCell(sel, i, i + 1)}
                  style={{
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    fontWeight: 800,
                    fontSize: 13,
                    opacity: i === rows[sel].length - 1 ? 0.22 : 1,
                    padding: '2px 4px',
                  }}
                >
                  ▼
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
            <button
              className="pill"
              style={{ flex: 1, padding: 10 }}
              onClick={() => shuffleBand(sel)}
            >
              Embaralhar ordem
            </button>
            {isAdmin && (
              <button className="pill ghost" style={{ padding: '10px 16px' }}>
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 36,
          alignItems: 'start',
          marginTop: 30,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
        }}
      >
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Comentários
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Avatar color="var(--gold)" size={26} fontSize={10.5}>
              C
            </Avatar>
            <div
              className="card"
              style={{
                borderRadius: '0 12px 12px 12px',
                padding: '10px 13px',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              <b>Camila</b> <span style={{ color: 'var(--faint)', fontSize: 11 }}>· ontem</span>
              <br />
              Faixas 2 e 3 prontas!
            </div>
          </div>
        </div>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Histórico
          </div>
          <div
            style={{
              borderLeft: '1px solid var(--border-strong)',
              paddingLeft: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
              <b style={{ color: 'var(--ink)' }}>Camila</b> concluiu a faixa 3
              <div style={{ color: 'var(--faint)', fontSize: 11 }}>a fazer → feita · ontem</div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
              <b style={{ color: 'var(--ink)' }}>Regina</b> atribuiu a faixa 4
              <div style={{ color: 'var(--faint)', fontSize: 11 }}>— → Ana Luiza · 05/07</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
