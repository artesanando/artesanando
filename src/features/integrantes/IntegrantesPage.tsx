import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../../state/store'
import { Avatar, Lbl, Progress } from '../../components/ui/bits'
import { ini } from '../../lib/format'
import { hojeIso } from '../../lib/format'
import { fetchEmprestimosAtivos } from '../estoque/api'
import { fetchEncontros, fetchPresencas, frequenciaDe } from '../presenca/api'
import {
  emprestadosDe,
  entregasDe,
  fetchEntregasLight,
  fetchIntegrantes,
  filtraIntegrantes,
} from './api'
import { PREFERENCIA_LABEL } from '../../types/database'

export function IntegrantesPage() {
  const { isAdmin, open } = useStore()
  const navigate = useNavigate()
  const { id } = useParams()
  const [busca, setBusca] = useState('')
  const hoje = hojeIso()

  const { data: integrantes, isLoading } = useQuery({
    queryKey: ['integrantes'],
    queryFn: fetchIntegrantes,
  })
  const { data: encontros } = useQuery({ queryKey: ['encontros'], queryFn: fetchEncontros })
  const { data: presencas } = useQuery({ queryKey: ['presencas'], queryFn: fetchPresencas })
  const { data: loans } = useQuery({ queryKey: ['emprestimos'], queryFn: fetchEmprestimosAtivos })
  const { data: entregas } = useQuery({ queryKey: ['entregas-light'], queryFn: fetchEntregasLight })

  const lista = filtraIntegrantes(integrantes ?? [], busca)
  const sel = (integrantes ?? []).find((p) => p.id === id) ?? lista[0]

  const freqDe = (pid: string) => frequenciaDe(pid, encontros ?? [], presencas ?? [], hoje)

  const selFreq = sel ? freqDe(sel.id) : { presentes: 0, total: 0, pct: 0 }
  const selEntregas = sel && entregas ? entregasDe(sel.id, entregas) : { amigurumis: 0, faixas: 0, total: 0 }
  const selEmprestados = sel ? emprestadosDe(sel.id, loans ?? []) : 0

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
            Integrantes{' '}
            <span style={{ fontSize: 15, color: 'var(--faint)' }}>
              {(integrantes ?? []).length}
            </span>
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
          aria-label="Buscar integrante"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {isLoading && (
            <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--muted)' }}>
              Carregando…
            </div>
          )}
          {lista.length === 0 && !isLoading && (
            <div style={{ padding: '12px 8px', fontSize: 13, color: 'var(--muted)' }}>
              Ninguém encontrada{busca ? ` para "${busca}"` : ''}.
            </div>
          )}
          {lista.map((p) => {
            const selected = p.id === sel?.id
            const emprestados = emprestadosDe(p.id, loans ?? [])
            const ent = entregas ? entregasDe(p.id, entregas).total : 0
            const sub = `${ent} entregas${emprestados > 0 ? ` · ${emprestados} itens em casa` : ''}`
            const freq = freqDe(p.id)
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/integrantes/${p.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  ...(selected
                    ? { background: 'var(--chip-rose)', borderRadius: 10, margin: '6px 0' }
                    : { borderBottom: '1px solid var(--border)' }),
                }}
              >
                <Avatar color={p.avatar_color} size={32} fontSize={12}>
                  {ini(p.nome)}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.nome}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: selected ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: 600,
                    }}
                  >
                    {sub}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: selected ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {freq.pct}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {sel && (
        <div className="card" style={{ borderRadius: 16, padding: '24px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <Avatar color={sel.avatar_color} size={52} fontSize={18}>
              {ini(sel.nome)}
            </Avatar>
            <div>
              <div className="h" style={{ fontSize: 19 }}>
                {sel.nome}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                @{sel.usuario}
                {sel.desde ? ` · desde ${sel.desde}` : ''} ·{' '}
                {PREFERENCIA_LABEL[sel.preferencia].toLowerCase()}
              </div>
            </div>
          </div>
          <Lbl style={{ marginBottom: 12 }}>ENTREGAS NO SEMESTRE</Lbl>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#C08A2E' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Amigurumis concluídos</span>
              <b style={{ fontSize: 15 }}>{selEntregas.amigurumis}</b>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#7D9B76' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Faixas de tricô feitas</span>
              <b style={{ fontSize: 15 }}>{selEntregas.faixas}</b>
            </div>
          </div>
          {selEmprestados > 0 && (
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
              🧶 {selEmprestados} {selEmprestados === 1 ? 'item emprestado' : 'itens emprestados'}{' '}
              em casa — veja no Estoque.
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Lbl style={{ marginBottom: 6 }}>FREQUÊNCIA</Lbl>
              <Progress pct={`${selFreq.pct}%`} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {selFreq.presentes}/{selFreq.total} encontros · {selFreq.pct}%
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
                {selEntregas.total}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>entregas no semestre</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
