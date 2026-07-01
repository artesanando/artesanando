import { useStore } from '../../state/store'
import { Avatar } from '../../components/ui/bits'

const COLS = ['PROGRESSO', 'DEVOLUÇÕES', 'COMENTÁRIOS', 'FINANCEIRO']

export function ConfigPage() {
  const { perms, togglePerm } = useStore()

  return (
    <div
      style={{
        padding: '30px 40px',
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 34,
        alignItems: 'start',
      }}
    >
      <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="h" style={{ fontWeight: 500, fontSize: 26, marginBottom: 12 }}>
          Ajustes
        </div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--chip-rose)',
            color: 'var(--accent)',
            fontWeight: 800,
          }}
        >
          Permissões
        </div>
        <div style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 700 }}>Projeto</div>
        <div style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 700 }}>Encontros</div>
      </div>
      <div>
        <div className="h" style={{ fontSize: 18, marginBottom: 4 }}>
          Permissões das integrantes
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 8 }}>
          Defina o que cada integrante pode editar. O perfil de administradora é fixo.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--chip-soft)',
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 10,
            padding: '9px 13px',
            fontSize: 12,
            color: 'var(--primary-dark)',
            marginBottom: 20,
          }}
        >
          🔒 Apenas administradoras alteram permissões.
        </div>
        <div className="card" style={{ borderRadius: 14, overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr repeat(4,1fr)',
              padding: '10px 18px',
              background: 'var(--sand-head)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.4px',
              color: 'var(--faint)',
            }}
          >
            <div>INTEGRANTE</div>
            {COLS.map((c) => (
              <div key={c} style={{ textAlign: 'center' }}>
                {c}
              </div>
            ))}
          </div>
          {perms.map((p, pi) => (
            <div
              key={p.nome}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr repeat(4,1fr)',
                padding: '13px 18px',
                borderTop: '1px solid var(--divider)',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar color={p.cor} size={28} fontSize={10}>
                  {p.ini}
                </Avatar>
                <b>{p.nome}</b>
              </div>
              {p.flags.map((v, ti) => (
                <div key={ti} style={{ textAlign: 'center' }}>
                  <span
                    className="sw"
                    onClick={() => togglePerm(pi, ti)}
                    style={{ background: v ? 'var(--primary)' : '#E7DCCF', cursor: 'pointer' }}
                  >
                    <span style={v ? { right: 2 } : { left: 2 }} />
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
