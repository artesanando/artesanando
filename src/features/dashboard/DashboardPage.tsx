import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { Progress } from '../../components/ui/bits'

const KPIS: [string, string][] = [
  ['18', 'integrantes'],
  ['65', 'novelos em estoque'],
  ['5', 'novelos emprestados'],
  ['2', 'mantas em andamento'],
  ['2', 'amigurumis ativos'],
]

const ATIVIDADE: { cor: string; quem: string; texto: string; quando: string }[] = [
  { cor: '#C4798A', quem: 'Ana', texto: 'concluiu o miolo de 8 squares Modelo A · Primavera', quando: 'há 2h' },
  { cor: '#7D9B76', quem: 'Camila', texto: 'concluiu a faixa 3 · Manta Nuvem', quando: 'há 5h' },
  { cor: '#C9B98F', quem: 'Fernanda', texto: 'devolveu 2 novelos Balloon', quando: 'ontem' },
  { cor: '#8FA3B8', quem: 'Regina', texto: 'registrou presença de 07/07', quando: 'ontem' },
]

export function DashboardPage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()

  return (
    <div style={{ padding: '30px 40px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 26,
        }}
      >
        <div>
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Boa tarde, Regina
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Quinta, 10 de julho — próximo encontro{' '}
            <b style={{ color: 'var(--accent)' }}>terça 14, 14h · Sala 203</b>
          </div>
        </div>
        {isAdmin && (
          <button className="pill" onClick={() => open('projeto')}>
            + Novo projeto
          </button>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--border-strong)',
          borderBottom: '1px solid var(--border-strong)',
          padding: '18px 0',
          marginBottom: 30,
        }}
      >
        {KPIS.map(([n, l], i) => (
          <div
            key={l}
            style={{
              flex: 1,
              padding: '0 22px',
              borderRight: i < KPIS.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div className="h" style={{ fontSize: 30 }}>
              {n}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.55fr 1fr',
          gap: 44,
          alignItems: 'start',
        }}
      >
        <div>
          <div className="h" style={{ fontSize: 17, marginBottom: 14 }}>
            Em produção
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div
              onClick={() => navigate('/projetos')}
              style={{ padding: '16px 2px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Manta Primavera{' '}
                  <span style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--accent)' }}>
                    · crochê · 5 integrantes
                  </span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', flex: 'none' }}>
                  63/80
                </div>
              </div>
              <Progress pct="79%" style={{ margin: '10px 0 0' }} />
            </div>
            <div
              onClick={() => navigate('/projetos')}
              style={{ padding: '16px 2px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Manta Nuvem{' '}
                  <span style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--green-dark)' }}>
                    · tricô · 4 integrantes
                  </span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent)', flex: 'none' }}>
                  3/8 faixas
                </div>
              </div>
              <Progress pct="37%" style={{ margin: '10px 0 0' }} />
            </div>
            <div
              onClick={() => navigate('/projetos')}
              style={{
                padding: '16px 2px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                Amigurumi Capivara{' '}
                <span style={{ fontWeight: 600, fontSize: 11.5, color: 'var(--muted)' }}>
                  · 4 integrantes
                </span>
              </div>
              <span
                className="tag"
                style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
              >
                10/12 UND
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="h" style={{ fontSize: 17, marginBottom: 14 }}>
            Atividade recente
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ATIVIDADE.map((a, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 12, padding: i < ATIVIDADE.length - 1 ? '0 0 18px' : 0 }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: a.cor,
                    marginTop: 4,
                    flex: 'none',
                  }}
                />
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
                  <b style={{ color: 'var(--ink)' }}>{a.quem}</b> {a.texto}{' '}
                  <span style={{ color: 'var(--faint)' }}>· {a.quando}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
