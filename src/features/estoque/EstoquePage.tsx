import { useState, type CSSProperties } from 'react'
import { useStore } from '../../state/store'
import { ESTO_TABS, ESTOQUE, type EstoTabKey } from '../../mocks/data'

const tabStyle = (on: boolean): CSSProperties =>
  on
    ? {
        padding: '7px 15px',
        borderRadius: 99,
        background: 'var(--primary)',
        color: '#fff',
        fontWeight: 800,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }
    : {
        padding: '7px 15px',
        borderRadius: 99,
        border: '1px solid var(--field-border)',
        color: 'var(--ink-soft)',
        fontWeight: 700,
        fontSize: 12.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }

export function EstoquePage() {
  const { isAdmin, open } = useStore()
  const [estoTab, setEstoTab] = useState<EstoTabKey>('novelos')
  const tab = ESTOQUE[estoTab]
  const count = tab.rows.reduce((s, r) => s + (parseInt(r.disp) || 0), 0)

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Estoque
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Materiais e itens do projeto, organizados por tipo
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pill ghost" onClick={() => open('material')}>
              + Material
            </button>
            <button className="pill ghost" onClick={() => open('devolucao')}>
              Devolução
            </button>
            <button className="pill" onClick={() => open('emprestimo')}>
              + Empréstimo
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ESTO_TABS.map(([k, label]) => (
          <div key={k} onClick={() => setEstoTab(k)} style={tabStyle(k === estoTab)}>
            {label}
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
            <b style={{ color: 'var(--ink)' }}>{count}</b> {tab.unit} em estoque
          </div>
          <div
            className="lbl"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.2fr .7fr .9fr',
              padding: '8px 2px',
              borderBottom: '1px solid var(--border-strong)',
            }}
          >
            {tab.cols.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          {tab.rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.2fr .7fr .9fr',
                padding: '13px 2px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 800 }}>{r.a}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                }}
              >
                {r.dot && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: r.dot,
                      border: '1px solid rgba(0,0,0,.08)',
                      flex: 'none',
                    }}
                  />
                )}
                {r.det}
              </div>
              <div>
                <span
                  className="tag"
                  style={{
                    background: r.dTone === 'low' ? 'var(--chip-warn)' : 'var(--chip-green)',
                    color: r.dTone === 'low' ? 'var(--gold-dark)' : 'var(--green-dark)',
                  }}
                >
                  {r.disp}
                </span>
              </div>
              <div style={{ fontSize: 12 }}>
                {r.empr === '—' ? (
                  <span style={{ color: 'var(--faint-3)', fontWeight: 700 }}>—</span>
                ) : (
                  <span
                    className="tag"
                    style={{ background: 'var(--chip-rose)', color: 'var(--accent)' }}
                  >
                    {r.empr}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Empréstimos ativos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <b>Ana Luiza</b>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>30/06</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '3px 0 8px' }}>
                2 novelos Balloon rosé · Primavera
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                }}
                onClick={() => open('devolucao')}
              >
                Registrar devolução →
              </div>
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <b>Duda Ferreira</b>
                <span style={{ fontSize: 11, color: 'var(--faint)' }}>21/06</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '3px 0 8px' }}>
                3 novelos Mollet · Manta Nuvem
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                }}
                onClick={() => open('devolucao')}
              >
                Registrar devolução →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
