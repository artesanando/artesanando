import { useStore } from '../../state/store'
import { BIB_CAT, BIB_ITEMS, DET } from '../../mocks/data'
import { IconPdf } from '../../components/ui/icons'

export function BibliotecaPage() {
  const { isAdmin, open, openDetalhe, openGranny, openFaixa } = useStore()

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
          Biblioteca
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="pill ghost"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => openGranny(null)}
            >
              + Granny
            </button>
            <button
              className="pill ghost"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => openFaixa(null)}
            >
              + Faixa
            </button>
            <button
              className="pill"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => open('receita')}
            >
              + Receita
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, alignItems: 'center' }}>
        <input
          className="field"
          style={{ flex: 1, borderRadius: 99 }}
          placeholder="🔍 Buscar receita ou padrão…"
        />
        <span
          className="tag"
          style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '6px 14px',
            whiteSpace: 'nowrap',
          }}
        >
          Todos
        </span>
        {['Amigurumis', 'Granny', 'Faixas'].map((f) => (
          <span
            key={f}
            className="tag"
            style={{
              border: '1px solid var(--field-border)',
              color: 'var(--ink-soft)',
              padding: '6px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            {f}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {BIB_ITEMS.map(([name, catKey, sub, pages]) => {
          const c = BIB_CAT[catKey]
          const has = !!DET[name]
          return (
            <div
              key={name}
              className="card"
              onClick={has ? () => openDetalhe(name) : undefined}
              style={{
                overflow: 'hidden',
                cursor: has ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ height: 5, background: c.accent }} />
              <div
                style={{
                  padding: '16px 16px 14px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: c.fg,
                    background: c.chip,
                    padding: '4px 10px',
                    borderRadius: 99,
                  }}
                >
                  {c.lbl}
                </span>
                <div
                  style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25, margin: '12px 0 4px' }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {sub} · {pages}
                </div>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--divider)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <IconPdf />
                    PDF
                  </span>
                  {has && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: c.fg,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Abrir →
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div
          onClick={() => open('receita')}
          style={{
            border: '2px dashed var(--field-border)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: 'var(--faint)',
            cursor: 'pointer',
            minHeight: 150,
          }}
        >
          <div style={{ fontSize: 22 }}>+</div>
          <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
            Adicionar
            <br />
            receita ou padrão
          </div>
        </div>
      </div>
    </div>
  )
}
