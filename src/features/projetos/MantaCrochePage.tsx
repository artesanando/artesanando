import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { buildMapa, MODELS, type ModelKey } from '../../mocks/data'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'

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

function Fluxo() {
  const col = (
    titulo: string,
    n: number,
    bg: string,
    tituloCor: string,
    card: React.ReactNode,
  ) => (
    <div style={{ background: bg, borderRadius: 14, padding: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 800,
          color: tituloCor,
          marginBottom: 10,
        }}
      >
        <span>{titulo}</span>
        <span>{n}</span>
      </div>
      {card}
    </div>
  )
  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        miolo → aguardando borda → borda → pronto · o lote "precisa de alguém" fica livre para
        outra integrante pegar
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 12,
          marginBottom: 26,
        }}
      >
        {col(
          'MIOLO',
          1,
          '#F4EEE9',
          'var(--muted)',
          <div className="card" style={{ padding: '11px 12px', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Modelo B ×6</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Duda · carr. 1–8</div>
          </div>,
        )}
        {col(
          'AGUARDANDO BORDA',
          1,
          '#FBF1E7',
          'var(--gold-dark)',
          <div
            className="card"
            style={{ padding: '11px 12px', marginBottom: 8, borderColor: '#E7D6B8' }}
          >
            <div style={{ fontWeight: 800, fontSize: 13 }}>Modelo A ×8</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>miolo: Ana</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-dark)', marginTop: 6 }}>
              ↳ precisa de alguém
            </div>
          </div>,
        )}
        {col(
          'BORDA',
          1,
          '#F4EEE9',
          'var(--muted)',
          <div className="card" style={{ padding: '11px 12px', marginBottom: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Modelo A ×4</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              Beatriz · carr. 9–12
            </div>
          </div>,
        )}
        {col(
          'PRONTO',
          1,
          '#EEF3EA',
          'var(--green-dark)',
          <div
            className="card"
            style={{ padding: '11px 12px', marginBottom: 8, borderColor: '#D8E0D2' }}
          >
            <div style={{ fontWeight: 800, fontSize: 13 }}>Modelo C ×16</div>
            <div style={{ fontSize: 11, color: 'var(--green-dark)', fontWeight: 700, marginTop: 2 }}>
              ✓ Fernanda
            </div>
          </div>,
        )}
      </div>
    </>
  )
}

function Mapa({ selSquare, onPick }: { selSquare: number; onPick: (i: number) => void }) {
  const mapa = buildMapa()
  const sel = mapa[selSquare] || mapa[0]
  const selModel = MODELS[sel.m]
  const selCol = 'L' + (Math.floor(selSquare / 10) + 1) + ' C' + ((selSquare % 10) + 1)
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,30px)', gap: 3 }}>
          {mapa.map((sq) => (
            <div
              key={sq.i}
              onClick={() => onPick(sq.i)}
              title={`square ${sq.i}`}
              style={{
                width: 30,
                height: 30,
                background: sq.border,
                opacity: sq.done ? 1 : 0.38,
                boxShadow: sq.i === selSquare ? '0 0 0 2px var(--ink)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              <div style={{ width: 16, height: 16, background: sq.inner }} />
            </div>
          ))}
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="h" style={{ fontSize: 15, marginBottom: 10 }}>
            Padrões
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }}>
            {(['A', 'B', 'C'] as ModelKey[]).map((k) => {
              const md = MODELS[k]
              const total = mapa.filter((s) => s.m === k).length
              const done = mapa.filter((s) => s.m === k && s.done).length
              const full = done === total
              return (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '9px 2px',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12.5,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      style={{ width: 10, height: 10, borderRadius: 2, background: md.border }}
                    />
                    {md.nome.split('—')[0].trim()}
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: full ? 'var(--green-dark)' : 'var(--accent)',
                    }}
                  >
                    {done}/{total}
                    {full ? ' ✓' : ''}
                  </span>
                </div>
              )
            })}
          </div>
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
                  background: sel.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <div style={{ width: 22, height: 22, background: sel.inner }} />
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <b>{selModel.nome}</b>
                <br />
                <span style={{ color: 'var(--muted)' }}>miolo + borda</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function MantaCrochePage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()
  const [view, setView] = useState<'fluxo' | 'mapa'>('fluxo')
  const [selSquare, setSelSquare] = useState(26)

  return (
    <div style={{ padding: '26px 40px 34px' }}>
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        ‹ Projetos / <span style={{ color: 'var(--ink)' }}>Manta Primavera</span>
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
            Manta Primavera
          </div>
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
          >
            CROCHÊ
          </span>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('producao')}>
            + Registrar produção
          </button>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 18 }}>
        Destino: Hospital Infantil · 80 squares · padrões A/B/C · 5 integrantes
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <Progress pct="79%" style={{ flex: 1, height: 8 }} />
        <div className="h" style={{ fontSize: 19, color: 'var(--accent)', flex: 'none' }}>
          63
          <span style={{ color: 'var(--faint)', fontSize: 14 }}>/80 squares</span>
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
      {view === 'fluxo' ? <Fluxo /> : <Mapa selSquare={selSquare} onPick={setSelSquare} />}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}
      >
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Comentários
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <Avatar color="var(--green)" size={26} fontSize={10.5}>
              B
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
              <b>Beatriz</b> <span style={{ color: 'var(--faint)', fontSize: 11 }}>· hoje</span>
              <br />
              Peguei as bordas do Modelo A 👍
            </div>
          </div>
          <div
            className="field"
            style={{ borderRadius: 99, color: 'var(--faint)', borderStyle: 'dashed' }}
          >
            Escrever um comentário…
          </div>
        </div>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Histórico de alterações
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
              <b style={{ color: 'var(--ink)' }}>Ana</b> concluiu miolo Modelo A ×8
              <div style={{ color: 'var(--faint)', fontSize: 11 }}>
                → aguardando borda · hoje 14:32
              </div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
              <b style={{ color: 'var(--ink)' }}>Beatriz</b> pegou borda Modelo A ×4
              <div style={{ color: 'var(--faint)', fontSize: 11 }}>
                aguardando → borda · hoje 15:01
              </div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
              <b style={{ color: 'var(--ink)' }}>Fernanda</b> concluiu Modelo C ×16
              <div style={{ color: 'var(--faint)', fontSize: 11 }}>→ pronto · ontem</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
