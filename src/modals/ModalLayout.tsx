import { useStore } from '../state/store'
import { MODELS, type ModelKey } from '../mocks/data'
import { Lbl } from '../components/ui/bits'
import { ModalBox, ModalHeader } from './shared'

const KEYS: ModelKey[] = ['A', 'B', 'C']

export function ModalLayout() {
  const {
    layoutCols,
    layoutRows,
    layoutBrush,
    layoutMap,
    layoutPaint,
    pickBrush,
    incCols,
    decCols,
    incRows,
    decRows,
    backToProjeto,
  } = useStore()

  const cellModel = (r: number, c: number): ModelKey =>
    layoutMap[r + '-' + c] || KEYS[(r + c) % 3]

  const cells: { r: number; c: number; m: ModelKey }[] = []
  const cnt: Record<ModelKey, number> = { A: 0, B: 0, C: 0 }
  for (let r = 0; r < layoutRows; r++)
    for (let c = 0; c < layoutCols; c++) {
      const m = cellModel(r, c)
      cnt[m]++
      cells.push({ r, c, m })
    }

  return (
    <ModalBox maxWidth={640}>
      <ModalHeader
        title="Organizar quadrados na manta"
        sub="Escolha um modelo e toque nos quadrados para montar o próprio padrão da manta"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="lbl" style={{ marginRight: 2 }}>
          PINCEL
        </span>
        {KEYS.map((k) => {
          const md = MODELS[k]
          return (
            <div
              key={k}
              onClick={() => pickBrush(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                border: '1px solid var(--field-border)',
                borderRadius: 99,
                padding: '5px 12px 5px 6px',
                cursor: 'pointer',
                boxShadow: k === layoutBrush ? '0 0 0 2px var(--ink)' : undefined,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: md.border,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  borderRadius: 3,
                }}
              >
                <span style={{ width: 11, height: 11, background: md.inner }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Modelo {k}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              display: 'inline-grid',
              gridTemplateColumns: `repeat(${layoutCols},28px)`,
              gap: 3,
              background: 'var(--sand)',
              padding: 6,
              borderRadius: 8,
            }}
          >
            {cells.map(({ r, c, m }) => {
              const md = MODELS[m]
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => layoutPaint(r, c)}
                  style={{
                    width: 28,
                    height: 28,
                    background: md.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  <div style={{ width: 14, height: 14, background: md.inner }} />
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 170 }}>
          <Lbl style={{ marginBottom: 8 }}>TAMANHO</Lbl>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 700 }}>Colunas</span>
            <div
              className="field"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: 96,
                padding: '6px 12px',
              }}
            >
              <span
                onClick={decCols}
                style={{ cursor: 'pointer', color: 'var(--faint)', fontWeight: 800 }}
              >
                −
              </span>
              <b>{layoutCols}</b>
              <span
                onClick={incCols}
                style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 800 }}
              >
                +
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5,
              marginBottom: 16,
            }}
          >
            <span style={{ fontWeight: 700 }}>Linhas</span>
            <div
              className="field"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: 96,
                padding: '6px 12px',
              }}
            >
              <span
                onClick={decRows}
                style={{ cursor: 'pointer', color: 'var(--faint)', fontWeight: 800 }}
              >
                −
              </span>
              <b>{layoutRows}</b>
              <span
                onClick={incRows}
                style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 800 }}
              >
                +
              </span>
            </div>
          </div>
          <Lbl style={{ marginBottom: 8 }}>COMPOSIÇÃO</Lbl>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {KEYS.map((k) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 2px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 12.5,
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 2,
                      background: MODELS[k].border,
                    }}
                  />
                  Modelo {k}
                </span>
                <b style={{ color: 'var(--accent)' }}>{cnt[k]}</b>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 2px',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Total</span>
              <b className="h" style={{ fontSize: 15 }}>
                {layoutCols * layoutRows}
              </b>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
        <button className="pill ghost" onClick={backToProjeto}>
          Voltar
        </button>
        <button className="pill" onClick={backToProjeto}>
          Salvar montagem
        </button>
      </div>
    </ModalBox>
  )
}
