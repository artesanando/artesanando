import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { Progress } from '../../components/ui/bits'

interface AmigRowProps {
  emoji: string
  bg: string
  nome: string
  slug: string
  receita: string
  und: number
  meta: number
  pct: number
  integrantes: number
  entregue?: boolean
}

function AmigRow({ emoji, bg, nome, slug, receita, und, meta, pct, integrantes, entregue }: AmigRowProps) {
  const navigate = useNavigate()
  return (
    <div
      className="card"
      onClick={() => navigate(`/projetos/${slug}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.7fr 1.3fr 1.4fr .5fr',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `repeating-linear-gradient(-45deg,${bg} 0 6px,${bg}CC 6px 12px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
          }}
        >
          {emoji}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{nome}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{receita}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          {und} und <span style={{ color: 'var(--muted)', fontWeight: 600 }}>· meta {meta}</span>
        </div>
        <Progress
          pct={`${pct}%`}
          style={{ height: 5, marginTop: 6 }}
          fillStyle={pct >= 100 ? { background: 'var(--green)' } : undefined}
        />
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
        {integrantes} integrantes
      </div>
      {entregue ? (
        <div style={{ textAlign: 'right' }}>
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            ENTREGUE
          </span>
        </div>
      ) : (
        <div style={{ textAlign: 'right', color: 'var(--faint-3)' }}>›</div>
      )}
    </div>
  )
}

export function ProjetosPage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()

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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
              Projetos
            </div>
            <div
              className="field"
              style={{
                borderRadius: 99,
                padding: '6px 14px',
                fontWeight: 800,
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              2026.2 <span style={{ color: 'var(--faint)' }}>▾</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
            2 mantas · 3 tipos de amigurumi
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
          gap: 22,
          borderBottom: '1px solid var(--border-strong)',
          marginBottom: 18,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <div style={{ padding: '8px 2px', borderBottom: '2px solid var(--primary)' }}>Todos</div>
        <div style={{ padding: '8px 2px', color: 'var(--muted)' }}>
          Mantas <span style={{ color: 'var(--green-dark)' }}>2</span>
        </div>
        <div style={{ padding: '8px 2px', color: 'var(--muted)' }}>
          Amigurumis <span style={{ color: 'var(--amber)' }}>3</span>
        </div>
      </div>
      <div className="lbl" style={{ marginBottom: 10 }}>
        MANTAS
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 26,
        }}
      >
        <div
          className="card"
          onClick={() => navigate('/projetos/primavera')}
          style={{ padding: '16px 18px', cursor: 'pointer' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              Manta Primavera{' '}
              <span
                className="tag"
                style={{ background: 'var(--chip-rose)', color: 'var(--accent)', marginLeft: 4 }}
              >
                crochê
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>63/80</span>
          </div>
          <Progress pct="79%" />
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginTop: 8 }}>
            A 32/40 · B 15/24 · C 16/16 ✓
          </div>
        </div>
        <div
          className="card"
          onClick={() => navigate('/projetos/nuvem')}
          style={{ padding: '16px 18px', cursor: 'pointer' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              Manta Nuvem{' '}
              <span
                className="tag"
                style={{ background: 'var(--chip-green)', color: 'var(--green-dark)', marginLeft: 4 }}
              >
                tricô
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>3/8</span>
          </div>
          <Progress pct="37%" />
          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginTop: 8 }}>
            8 faixas · divididas entre 4 integrantes
          </div>
        </div>
      </div>
      <div className="lbl" style={{ marginBottom: 10 }}>
        AMIGURUMIS · por tipo
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AmigRow
          emoji="🦫"
          bg="#F6E4E6"
          nome="Capivara"
          slug="capivara"
          receita="Capivara da Lú"
          und={10}
          meta={12}
          pct={83}
          integrantes={4}
        />
        <AmigRow
          emoji="🐙"
          bg="#F6E4E6"
          nome="Polvo Rosa"
          slug="polvo"
          receita="Polvinho p/ prematuros"
          und={4}
          meta={20}
          pct={20}
          integrantes={2}
        />
        <AmigRow
          emoji="🐰"
          bg="#EAF0E6"
          nome="Coelhinha"
          slug="coelhinha"
          receita="Coelha Nina"
          und={8}
          meta={8}
          pct={100}
          integrantes={4}
          entregue
        />
      </div>
    </div>
  )
}
