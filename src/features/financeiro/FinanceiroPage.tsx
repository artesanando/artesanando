import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { useAuth } from '../../state/auth'
import { Lbl } from '../../components/ui/bits'
import { fmtCentavos, fmtDataCurta, hojeIso } from '../../lib/format'
import { fetchMovimentacoes, saldo, totalDoMes } from './api'

export function FinanceiroPage() {
  const { openFin } = useStore()
  const { can } = useAuth()
  const { data: movs, isLoading, isError } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: fetchMovimentacoes,
  })

  const mesRef = hojeIso().slice(0, 7)
  const kpiSaldo = saldo(movs ?? [])
  const entradasMes = totalDoMes(movs ?? [], 'entrada', mesRef)
  const saidasMes = totalDoMes(movs ?? [], 'saida', mesRef)

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
        {can('financeiro') && (
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
        className="pgrid"
        style={{ '--cols': '1.4fr 1fr 1fr', '--gap': '14px', marginBottom: 28 } as React.CSSProperties}
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
            {fmtCentavos(kpiSaldo)}
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>ENTRADAS · MÊS</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--green-dark)', marginTop: 6 }}>
            + {fmtCentavos(entradasMes)}
          </div>
        </div>
        <div className="card" style={{ borderRadius: 16, padding: '20px 22px' }}>
          <Lbl>SAÍDAS · MÊS</Lbl>
          <div className="h" style={{ fontSize: 26, color: 'var(--accent)', marginTop: 6 }}>
            − {fmtCentavos(saidasMes)}
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
        {isLoading && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--muted)' }}>
            Carregando…
          </div>
        )}
        {isError && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--accent)' }}>
            Não foi possível carregar o caixa. Recarregue a página.
          </div>
        )}
        {(movs ?? []).length === 0 && !isLoading && !isError && (
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--muted)' }}>
            Nenhuma movimentação registrada.
          </div>
        )}
        {(movs ?? []).map((m, i, arr) => {
          const entrada = m.tipo === 'entrada'
          return (
            <div
              key={m.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '.9fr 2.4fr 1.2fr 1fr',
                padding: '13px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : undefined,
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{fmtDataCurta(m.data)}</div>
              <div style={{ fontWeight: 700 }}>{m.descricao}</div>
              <div>
                <span
                  className="tag"
                  style={{
                    background: entrada ? 'var(--chip-green)' : 'var(--chip-rose)',
                    color: entrada ? 'var(--green-dark)' : 'var(--accent)',
                  }}
                >
                  {m.categoria}
                </span>
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontWeight: 800,
                  color: entrada ? 'var(--green-dark)' : 'var(--accent)',
                }}
              >
                {entrada ? '+' : '−'} {fmtCentavos(m.valor_centavos).replace('R$ ', '')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
