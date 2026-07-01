import { useStore } from '../../state/store'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'

function Member({
  iniS,
  color,
  name,
  sub,
  pct,
  selected,
}: {
  iniS: string
  color: string
  name: string
  sub: string
  pct: string
  selected?: boolean
}) {
  const subColor = selected ? 'var(--accent)' : 'var(--muted)'
  const pctColor = selected ? 'var(--accent)' : 'var(--muted)'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 8px',
        ...(selected
          ? { background: 'var(--chip-rose)', borderRadius: 10, margin: '6px 0' }
          : { borderBottom: '1px solid var(--border)' }),
      }}
    >
      <Avatar color={color} size={32} fontSize={12}>
        {iniS}
      </Avatar>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: subColor, fontWeight: 600 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: pctColor }}>{pct}</div>
    </div>
  )
}

const ENTREGAS: [string, string, number][] = [
  ['#DFA2AC', 'Miolos de granny', 24],
  ['#7D9B76', 'Bordas de granny', 12],
  ['#C08A2E', 'Amigurumis', 3],
  ['#D98A96', 'Itens de feira', 2],
]

export function IntegrantesPage() {
  const { isAdmin, open } = useStore()

  return (
    <div
      style={{
        padding: '30px 40px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: 40,
        alignItems: 'start',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div className="h" style={{ fontWeight: 500, fontSize: 28 }}>
            Integrantes <span style={{ fontSize: 15, color: 'var(--faint)' }}>18</span>
          </div>
          {isAdmin && (
            <button
              className="pill"
              style={{ padding: '8px 16px' }}
              onClick={() => open('integrante')}
            >
              + Cadastrar
            </button>
          )}
        </div>
        <input
          className="field"
          style={{ borderRadius: 99, marginBottom: 14 }}
          placeholder="🔍 Buscar integrante…"
        />
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <Member
            iniS="AL"
            color="#C4798A"
            name="Ana Luiza Prado"
            sub="3 projetos · 2 novelos em casa"
            pct="92%"
            selected
          />
          <Member iniS="B" color="#7D9B76" name="Beatriz Gomes" sub="1 projeto" pct="83%" />
          <Member iniS="C" color="#C9B98F" name="Camila Rocha" sub="2 projetos" pct="75%" />
          <Member iniS="F" color="#8FA3B8" name="Fernanda Dias" sub="1 projeto" pct="100%" />
        </div>
      </div>
      <div className="card" style={{ borderRadius: 16, padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <Avatar color="#C4798A" size={52} fontSize={18}>
            AL
          </Avatar>
          <div>
            <div className="h" style={{ fontSize: 19 }}>
              Ana Luiza Prado
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>@analuiza · desde 2025.1</div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Lbl>ENTREGAS NO SEMESTRE</Lbl>
          <div
            className="field"
            style={{
              borderRadius: 99,
              padding: '6px 14px',
              fontWeight: 800,
              display: 'flex',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            2026.2 <span style={{ color: 'var(--faint)' }}>▾</span>
          </div>
        </div>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          {ENTREGAS.map(([cor, nome, qtd], i) => (
            <div
              key={nome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: cor }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{nome}</span>
              <b style={{ fontSize: 15 }}>{qtd}</b>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--chip-rose)',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 11.5,
            color: 'var(--primary-dark)',
            marginBottom: 16,
          }}
        >
          ▦ Os 2 itens de feira também entraram no estoque da feira.
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Lbl style={{ marginBottom: 6 }}>FREQUÊNCIA</Lbl>
            <Progress pct="92%" />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              11/12 encontros · 92%
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              borderLeft: '1px solid var(--border)',
              paddingLeft: 16,
            }}
          >
            <div className="h" style={{ fontSize: 24, color: 'var(--accent)' }}>
              41
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>entregas no semestre</div>
          </div>
        </div>
      </div>
    </div>
  )
}
