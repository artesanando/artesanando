import { useStore } from '../state/store'
import { DET } from '../mocks/data'
import { Lbl } from '../components/ui/bits'
import { ModalBox } from './shared'

export function ModalDetalhe() {
  const { detKey, close, isAdmin, mantaTRows } = useStore()
  const det = detKey ? DET[detKey] : undefined
  if (!det || !detKey) return null

  let body: React.ReactNode = null
  if (det.kind === 'faixa' && det.seq && det.materiais) {
    body = (
      <>
        <Lbl style={{ marginBottom: 9 }}>SEQUÊNCIA DE CORES</Lbl>
        <div
          style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #E7D9D2',
            marginBottom: 22,
          }}
        >
          {det.seq.map((c, i) => (
            <div key={i} style={{ flex: 1, height: 40, background: c }} />
          ))}
        </div>
        <Lbl style={{ marginBottom: 10 }}>MATERIAIS</Lbl>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}
        >
          {det.materiais.map((m) => (
            <div
              key={m.name}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: m.c,
                  border: '1px solid rgba(0,0,0,.1)',
                  flex: 'none',
                }}
              />
              <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
              <span style={{ color: 'var(--muted)' }}>{m.qty}</span>
            </div>
          ))}
        </div>
      </>
    )
  } else if (det.kind === 'manta' && det.paleta && det.montagem) {
    body = (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            alignItems: 'start',
            marginBottom: 22,
          }}
        >
          <div>
            <Lbl style={{ marginBottom: 9 }}>ESQUEMA</Lbl>
            <div
              style={{
                border: '1.5px solid #D8C7BF',
                borderRadius: 6,
                overflow: 'hidden',
                width: 150,
              }}
            >
              {mantaTRows.map((r, i) => (
                <div key={i} style={{ display: 'flex', height: 20 }}>
                  {r.map((c, j) => (
                    <div key={j} style={{ flex: 1, background: c }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div>
            <Lbl style={{ marginBottom: 9 }}>PALETA</Lbl>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {det.paleta.map((p) => (
                <div
                  key={p.name}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      background: p.c,
                      border: '1px solid rgba(0,0,0,.1)',
                      flex: 'none',
                    }}
                  />
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                </div>
              ))}
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}
            >
              Toda faixa usa essas 3 cores — só muda a ordem.
            </div>
          </div>
        </div>
        <Lbl style={{ marginBottom: 11 }}>MONTAGEM</Lbl>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {det.montagem.map((t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 11,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'var(--ink-soft)',
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--chip-rose)',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                {i + 1}
              </span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </>
    )
  } else if (det.kind === 'granny' && det.rings) {
    const dr = det.rings
    const squares = dr
      .map((r, i) => ({ c: r.c, sz: 132 - (dr.length - 1 - i) * (108 / dr.length) }))
      .reverse()
    body = (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 24,
          alignItems: 'start',
          marginBottom: 22,
        }}
      >
        <div>
          <Lbl style={{ marginBottom: 9 }}>PRÉVIA</Lbl>
          <div
            style={{
              width: 132,
              height: 132,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--sand)',
            }}
          >
            {squares.map((ring, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: ring.sz,
                  height: ring.sz,
                  background: ring.c,
                }}
              />
            ))}
          </div>
          <div
            style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}
          >
            centro → borda
          </div>
        </div>
        <div>
          <Lbl style={{ marginBottom: 9 }}>CARREIRAS</Lbl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dr.map((r) => (
              <div
                key={r.name + r.role}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: r.c,
                    border: '1px solid rgba(0,0,0,.1)',
                    flex: 'none',
                  }}
                />
                <span style={{ flex: 1, fontWeight: 700 }}>
                  {r.name}{' '}
                  <span style={{ color: 'var(--faint)', fontWeight: 600 }}>· {r.role}</span>
                </span>
                <span style={{ color: 'var(--muted)' }}>{r.n}×</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ModalBox maxWidth={600} noPadding>
      <div
        style={{
          background: det.tBg,
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="tag" style={{ background: 'var(--card)', color: det.tC }}>
            {det.tag}
          </span>
          <div className="h" style={{ fontSize: 23, marginTop: 10 }}>
            {detKey}
          </div>
          <div style={{ fontSize: 12, color: '#7A6C62', marginTop: 2 }}>{det.sub}</div>
        </div>
        <button className="x" onClick={close}>
          ×
        </button>
      </div>
      <div style={{ padding: '22px 26px' }}>
        <div
          style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)', marginBottom: 20 }}
        >
          {det.resumo}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {det.specs.map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
              <Lbl style={{ marginBottom: 4 }}>{k}</Lbl>
              <div className="h" style={{ fontSize: 15 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
        {body}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            marginTop: 24,
            paddingTop: 18,
            borderTop: '1px solid var(--border)',
          }}
        >
          <button className="pill ghost" onClick={close}>
            Fechar
          </button>
          {isAdmin && <button className="pill">Usar em projeto</button>}
        </div>
      </div>
    </ModalBox>
  )
}
