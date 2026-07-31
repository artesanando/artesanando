import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { Select } from '../../components/ui/bits'
import { useToast } from '../../components/ui/Toast'
import { Comentarios } from './Comentarios'
import {
  adicionarUnidade,
  concluirUnidades,
  fetchIntegrantesAtivas,
  fetchReceitaNome,
  fetchUnidades,
  gruposUnidades,
  inserirAtividade,
  progressoUnidades,
  type Projeto,
} from './api'

export function AmigurumiPage({ projeto }: { projeto: Projeto }) {
  const { profile, can } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const [addAberto, setAddAberto] = useState(false)
  const [respId, setRespId] = useState('')

  const { data: unidades } = useQuery({
    queryKey: ['unidades', projeto.id],
    queryFn: () => fetchUnidades(projeto.id),
  })
  const { data: receita } = useQuery({
    queryKey: ['receita-nome', projeto.receita_id],
    queryFn: () => fetchReceitaNome(projeto.receita_id!),
    enabled: !!projeto.receita_id,
  })
  const { data: integrantes } = useQuery({
    queryKey: ['integrantes-min'],
    queryFn: fetchIntegrantesAtivas,
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['unidades', projeto.id] })
    qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
  }

  const adicionar = useMutation({
    mutationFn: async () => {
      const prox = Math.max(0, ...(unidades ?? []).map((u) => u.numero)) + 1
      await adicionarUnidade(projeto.id, prox, respId)
      await inserirAtividade({
        autor_id: profile!.id,
        tipo: 'unidade',
        projeto_id: projeto.id,
        payload: { texto: `adicionou a unidade #${prox}` },
      })
    },
    onSuccess: () => {
      setAddAberto(false)
      setRespId('')
      invalidar()
      toast('Unidade adicionada ✓')
    },
    onError: () => toast('Não foi possível adicionar a unidade.', 'erro'),
  })

  const concluir = useMutation({
    mutationFn: async (ids: string[]) => {
      await concluirUnidades(ids)
      await inserirAtividade({
        autor_id: profile!.id,
        tipo: 'unidade',
        projeto_id: projeto.id,
        payload: { texto: `concluiu ${ids.length} unidade(s)` },
      })
    },
    onSuccess: () => {
      invalidar()
      toast('Unidades concluídas ✓')
    },
    onError: () => toast('Não foi possível concluir.', 'erro'),
  })

  const prog = progressoUnidades(unidades ?? [], projeto.meta)
  const grupos = gruposUnidades(unidades ?? [])

  return (
    <div style={{ padding: '26px 40px 34px' }}>
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        ‹ Projetos / <span style={{ color: 'var(--ink)' }}>Amigurumi {projeto.nome}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="h" style={{ fontWeight: 500, fontSize: 26 }}>
          Amigurumi {projeto.nome}
        </div>
        <span
          className="tag"
          style={{ border: '1px solid var(--chip-rose-border)', color: 'var(--accent)' }}
        >
          {prog.done}/{prog.total} UND
        </span>
        {projeto.status === 'entregue' && (
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            ENTREGUE
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 22 }}>
        Cada unidade é feita integralmente por uma integrante
        {projeto.destino ? ` · destino: ${projeto.destino}` : ''}
      </div>
      <div className="pgrid" style={{ '--cols': '1.3fr 1fr', '--gap': '32px' } as React.CSSProperties}>
        <div>
          <div className="h" style={{ fontSize: 16, marginBottom: 12 }}>
            Unidades por integrante
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {grupos.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 12.5, color: 'var(--muted)' }}>
                Nenhuma unidade ainda — adicione a primeira.
              </div>
            )}
            {grupos.map((g, i) => (
              <div
                key={`${g.ini}-${g.nome}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  fontSize: 12.5,
                }}
              >
                <b>
                  {g.ini === g.fim ? `#${g.ini}` : `#${g.ini}–${g.fim}`} · {g.nome}
                </b>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!g.concluido && can('progresso') && (
                    <span
                      onClick={() => concluir.mutate(g.ids)}
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--green-dark)',
                        cursor: 'pointer',
                      }}
                    >
                      Concluir ✓
                    </span>
                  )}
                  <span
                    className="tag"
                    style={{
                      border: `1px solid ${g.concluido ? 'var(--chip-green-border)' : 'var(--chip-rose-border)'}`,
                      color: g.concluido ? 'var(--green-dark)' : 'var(--accent)',
                    }}
                  >
                    {g.concluido ? 'CONCLUÍDO' : 'EM PRODUÇÃO'}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {can('progresso') && !addAberto && (
            <div
              onClick={() => setAddAberto(true)}
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
          {addAberto && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <Select
                  ariaLabel="Responsável pela unidade"
                  value={respId}
                  onChange={setRespId}
                  options={[
                    ['', 'Responsável…'],
                    ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
                  ]}
                />
              </div>
              <button
                className="pill"
                disabled={!respId || adicionar.isPending}
                onClick={() => adicionar.mutate()}
              >
                Adicionar
              </button>
              <button className="pill ghost" onClick={() => setAddAberto(false)}>
                Cancelar
              </button>
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
              {receita ? (
                <b
                  style={{ color: 'var(--amber)', cursor: 'pointer' }}
                  onClick={() => navigate(`/biblioteca?receita=${receita.id}`)}
                >
                  {receita.nome} ↗
                </b>
              ) : (
                <span style={{ color: 'var(--faint-3)' }}>—</span>
              )}
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
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>Destino</span>
              <b>{projeto.destino ?? '—'}</b>
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
              <b>{projeto.meta ?? '—'} unidades</b>
            </div>
          </div>
          <Comentarios projetoId={projeto.id} />
        </div>
      </div>
    </div>
  )
}
