import { useStore } from '../../state/store'
import { Lbl } from '../../components/ui/bits'

const MOVS: { data: string; desc: string; cat: string; catTone: 'in' | 'out'; valor: string; tone: 'in' | 'out' }[] = [
  { data: '08 jul', desc: 'Bazar beneficente', cat: 'doação', catTone: 'in', valor: '+ 420,00', tone: 'in' },
  { data: '05 jul', desc: '12 novelos Círculo Balloon', cat: 'material', catTone: 'out', valor: '− 240,00', tone: 'out' },
  { data: '02 jul', desc: 'Doação — Profa. Regina', cat: 'doação', catTone: 'in', valor: '+ 260,00', tone: 'in' },
]

export function FinanceiroPage() {
  const { isAdmin, openFin } = useStore()

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Financeiro
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
            Caixa do projeto · semestre 2026.2
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pill ghost" onClick={() => openFin('saida')}>
              ↓ Saída
            </button>
            <button className="pill" onClick={() => openFin('entrada')}>
              ↑ Entrada
            </button>
          </div>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 16,
            background: 'var(--chip-rose)',
            padding: '20px 22px',
          }}
        >
          <Lbl style={{ color: 'var(--accent)' }}>SALDO ATUAL</Lbl>
          <div className="h" style={{ fontSize: 34, color: 'var(--primary-dark)', marginTop: 4 }}>
            R$ 1.240,50
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>ENTRADAS · MÊS</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--green-dark)', marginTop: 6 }}>
            + R$ 680
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>SAÍDAS · MÊS</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--accent)', marginTop: 6 }}>
            − R$ 240
          </div>
        </div>
      </div>
      <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
        Movimentações
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          className="lbl"
          style={{
            display: 'grid',
            gridTemplateColumns: '.9fr 2.4fr 1.2fr 1fr',
            padding: '9px 20px',
            background: 'var(--sand-head)',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <div>DATA</div>
          <div>DESCRIÇÃO</div>
          <div>CATEGORIA</div>
          <div style={{ textAlign: 'right' }}>VALOR</div>
        </div>
        {MOVS.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '.9fr 2.4fr 1.2fr 1fr',
              padding: '13px 20px',
              borderBottom: i < MOVS.length - 1 ? '1px solid var(--divider)' : undefined,
              fontSize: 13,
              alignItems: 'center',
            }}
          >
            <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{m.data}</div>
            <div style={{ fontWeight: 700 }}>{m.desc}</div>
            <div>
              <span
                className="tag"
                style={{
                  background: m.catTone === 'in' ? 'var(--chip-green)' : 'var(--chip-rose)',
                  color: m.catTone === 'in' ? 'var(--green-dark)' : 'var(--accent)',
                }}
              >
                {m.cat}
              </span>
            </div>
            <div
              style={{
                textAlign: 'right',
                fontWeight: 800,
                color: m.tone === 'in' ? 'var(--green-dark)' : 'var(--accent)',
              }}
            >
              {m.valor}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
