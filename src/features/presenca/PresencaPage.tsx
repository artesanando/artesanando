import { useStore } from '../../state/store'
import { CHAMADA } from '../../mocks/data'
import { ini } from '../../lib/format'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'

const ANTERIORES: [string, string, string, boolean][] = [
  ['07 jul', '89%', '16 presentes', true],
  ['30 jun', '78%', '14 presentes', false],
  ['23 jun', '67%', '12 presentes', false],
]

export function PresencaPage() {
  const { isAdmin, open } = useStore()

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
            Presença
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            12 encontros no semestre · média de 14 presentes
          </div>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('encontro')}>
            + Novo encontro
          </button>
        )}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              border: '1px solid var(--chip-rose-border)',
              background: 'var(--chip-rose)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 16,
            }}
          >
            <Lbl style={{ color: 'var(--accent)' }}>PRÓXIMO ENCONTRO</Lbl>
            <div className="h" style={{ fontSize: 20, margin: '6px 0 2px' }}>
              Terça, 14 de julho · 14h
            </div>
            <div style={{ fontSize: 12.5, color: '#8E6B70' }}>
              Sala 203 · pauta: montagem da Manta Primavera
            </div>
          </div>
          <div className="h" style={{ fontSize: 16, marginBottom: 10 }}>
            Encontros anteriores
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {ANTERIORES.map(([data, pct, presentes, destaque]) => (
              <div
                key={data}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 2px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13.5, width: 74 }}>{data}</div>
                <Progress
                  pct={pct}
                  style={{ flex: 1 }}
                  fillStyle={destaque ? undefined : { background: '#D8A3AE' }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: destaque ? 800 : 700,
                    color: destaque ? 'var(--accent)' : 'var(--muted)',
                    width: 88,
                    textAlign: 'right',
                  }}
                >
                  {presentes}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <div className="h" style={{ fontSize: 16 }}>
              Chamada · 07 jul
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              16/18 presentes
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {CHAMADA.map(([name, color, present]) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 2px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <Avatar color={color} size={26} fontSize={10}>
                  {ini(name)}
                </Avatar>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{name}</div>
                {present ? (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </div>
                ) : (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '1.5px dashed var(--field-border)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
