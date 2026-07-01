import { useNavigate } from 'react-router-dom'
import { useStore } from '../../state/store'
import { Avatar } from '../../components/ui/bits'

function Row({ t, tag, tone, first }: { t: string; tag: string; tone: 'ok' | 'prod'; first?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: first ? undefined : '1px solid var(--border)',
        fontSize: 12.5,
      }}
    >
      <b>{t}</b>
      <span
        className="tag"
        style={{
          border: `1px solid ${tone === 'ok' ? 'var(--chip-green-border)' : 'var(--chip-rose-border)'}`,
          color: tone === 'ok' ? 'var(--green-dark)' : 'var(--accent)',
        }}
      >
        {tag}
      </span>
    </div>
  )
}

export function AmigurumiPage() {
  const { isAdmin, openDetalhe } = useStore()
  const navigate = useNavigate()

  return (
    <div style={{ padding: '26px 40px 34px' }}>
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        ‹ Projetos / <span style={{ color: 'var(--ink)' }}>Amigurumi Capivara</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="h" style={{ fontWeight: 500, fontSize: 26 }}>
          Amigurumi Capivara
        </div>
        <span
          className="tag"
          style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
        >
          10/12 UND
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 22 }}>
        Cada unidade é feita integralmente por uma integrante · destino: Dia das Crianças
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Unidades por integrante
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <Row t="#1–3 · Ana Luiza" tag="CONCLUÍDO" tone="ok" first />
            <Row t="#4–6 · Beatriz" tag="CONCLUÍDO" tone="ok" />
            <Row t="#7–10 · Camila" tag="CONCLUÍDO" tone="ok" />
            <Row t="#11–12 · Duda" tag="EM PRODUÇÃO" tone="prod" />
          </div>
          {isAdmin && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: 'var(--accent)',
                marginTop: 12,
                cursor: 'pointer',
              }}
            >
              + Adicionar unidade
            </div>
          )}
        </div>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Ficha
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '11px 2px',
                borderBottom: '1px solid var(--border)',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Receita</span>
              <b
                style={{ color: 'var(--amber)', cursor: 'pointer' }}
                onClick={() => openDetalhe('Capivara da Lú')}
              >
                Capivara da Lú ↗
              </b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '11px 2px',
                borderBottom: '1px solid var(--border)',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Fio</span>
              <b>Amigurumi Soft · marrom</b>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '11px 2px',
                borderBottom: '1px solid var(--border)',
                fontSize: 12.5,
              }}
            >
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Meta</span>
              <b>12 unidades</b>
            </div>
          </div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Comentários
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Avatar color="var(--fill)" size={26} fontSize={10}>
              AL
            </Avatar>
            <div
              className="card"
              style={{
                borderRadius: '0 12px 12px 12px',
                padding: '10px 13px',
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              <b>Ana Luiza</b>{' '}
              <span style={{ color: 'var(--faint)', fontSize: 11 }}>· há 3 dias</span>
              <br />
              Minhas 3 prontas 🧶
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
