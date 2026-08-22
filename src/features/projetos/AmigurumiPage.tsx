import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { MenuKebab, Select } from '../../components/ui/controles'
import { Stepper } from '../../components/ui/bits'
import { useConfirmar } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { Comentarios } from './Comentarios'
import { IconChevron, IconSetaLonga } from '../../components/ui/icons'
import { AcoesProjeto, AvisoArquivado, ProgressoProjeto } from './CabecalhoProjeto'
import {
  adicionarUnidades,
  concluirUnidades,
  reabrirUnidades,
  reatribuirUnidades,
  removerUnidades,
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
  const confirmar = useConfirmar()
  const [addAberto, setAddAberto] = useState(false)
  const [respId, setRespId] = useState('')
  const [quantas, setQuantas] = useState(1)
  const [reatribuindo, setReatribuindo] = useState<string | null>(null)
  const [novoResp, setNovoResp] = useState('')
  /* Quase nunca a integrante termina o lote inteiro de uma vez — concluir passa
     por um contador de quantas ficaram prontas, da menor numeração para a maior. */
  const [concluindo, setConcluindo] = useState<string | null>(null)
  const [quantasProntas, setQuantasProntas] = useState(1)

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
      await adicionarUnidades(projeto.id, prox, quantas, respId)
      await inserirAtividade({
        autor_id: profile!.id,
        tipo: 'unidade',
        projeto_id: projeto.id,
        payload: {
          texto:
            quantas === 1
              ? `adicionou a unidade #${prox}`
              : `adicionou ${quantas} unidades (#${prox}–${prox + quantas - 1})`,
        },
      })
    },
    onSuccess: () => {
      setAddAberto(false)
      setRespId('')
      setQuantas(1)
      invalidar()
      toast('Unidades adicionadas')
    },
    onError: () => toast('Não foi possível adicionar as unidades.', 'erro'),
  })

  const reatribuir = useMutation({
    mutationFn: (ids: string[]) => reatribuirUnidades(ids, novoResp),
    onSuccess: () => {
      setReatribuindo(null)
      setNovoResp('')
      invalidar()
      toast('Unidades reatribuídas')
    },
    onError: () => toast('Não foi possível reatribuir.', 'erro'),
  })

  const remover = useMutation({
    mutationFn: (ids: string[]) => removerUnidades(ids),
    onSuccess: () => {
      invalidar()
      toast('Unidades removidas')
    },
    onError: () => toast('Não foi possível remover.', 'erro'),
  })

  const reabrir = useMutation({
    mutationFn: (ids: string[]) => reabrirUnidades(ids),
    onSuccess: () => {
      invalidar()
      toast('Unidades reabertas')
    },
    onError: () => toast('Não foi possível reabrir.', 'erro'),
  })

  const concluir = useMutation({
    mutationFn: async (ids: string[]) => {
      await concluirUnidades(ids)
      await inserirAtividade({
        autor_id: profile!.id,
        tipo: 'unidade',
        projeto_id: projeto.id,
        payload: {
          texto: ids.length === 1 ? 'concluiu 1 unidade' : `concluiu ${ids.length} unidades`,
        },
      })
    },
    onSuccess: () => {
      setConcluindo(null)
      setQuantasProntas(1)
      invalidar()
      toast('Unidades concluídas')
    },
    onError: () => toast('Não foi possível concluir.', 'erro'),
  })

  const prog = progressoUnidades(unidades ?? [], projeto.meta)
  const grupos = gruposUnidades(unidades ?? [])

  return (
    <div className="pagina">
      <div className="crumb" onClick={() => navigate('/projetos')} style={{ marginBottom: 8 }}>
        <IconChevron size={11} para="esquerda" /> Projetos / <span style={{ color: 'var(--ink)' }}>Amigurumi {projeto.nome}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div className="h titulo-pagina">
          Amigurumi {projeto.nome}
        </div>
        {projeto.status === 'entregue' && (
          <span
            className="tag"
            style={{ border: '1px solid var(--chip-green-border)', color: 'var(--green-dark)' }}
          >
            ENTREGUE
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>
          <AcoesProjeto projeto={projeto} />
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 22 }}>
        Cada unidade é feita integralmente por uma integrante
        {projeto.destino ? ` · destino: ${projeto.destino}` : ''}
      </div>
      <AvisoArquivado projeto={projeto} />
      <ProgressoProjeto done={prog.done} total={prog.total} unidade="unidades" />
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
            {grupos.map((g, i) => {
              const chave = g.ids.join(',')
              /* A numeração continua no banco — é ela que ordena e que os textos
                 de histórico citam. Na tela, quem trabalha quer saber quantas
                 peças são, não qual é o número de cada uma. */
              const rotulo = `${g.ids.length} ${g.ids.length === 1 ? 'unidade' : 'unidades'}`
              return (
                <div key={chave} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                  <div className="linha-grupo-und">
                    <b>
                      {rotulo} · {g.nome}
                    </b>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {!g.concluido && can('progresso') && (
                        <button
                          type="button"
                          onClick={() => {
                            setConcluindo(concluindo === chave ? null : chave)
                            setQuantasProntas(g.ids.length)
                          }}
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'var(--green-dark)',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'none',
                            fontFamily: 'inherit',
                            padding: 0,
                          }}
                        >
                          Concluir
                        </button>
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
                      {can('progresso') && (
                        <MenuKebab
                          ariaLabel={`Ações das unidades de ${g.nome}`}
                          acoes={[
                            { label: 'Reatribuir', onSelect: () => setReatribuindo(chave) },
                            ...(g.concluido
                              ? [{ label: 'Reabrir', onSelect: () => reabrir.mutate(g.ids) }]
                              : []),
                            {
                              label: 'Remover',
                              perigo: true,
                              onSelect: async () => {
                                const ok = await confirmar({
                                  titulo:
                                    g.ids.length === 1
                                      ? `Remover a unidade #${g.ini} de ${g.nome}?`
                                      : `Remover ${g.ids.length} unidades de ${g.nome}?`,
                                  okLabel: 'Remover',
                                  perigo: true,
                                })
                                if (ok) remover.mutate(g.ids)
                              },
                            },
                          ]}
                        />
                      )}
                    </span>
                  </div>

                  {concluindo === chave && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 16px 12px',
                        flexWrap: 'wrap',
                        fontSize: 12.5,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Quantas ficaram prontas?</span>
                      <div style={{ width: 110 }}>
                        <Stepper
                          value={Math.min(quantasProntas, g.ids.length)}
                          onChange={setQuantasProntas}
                          min={1}
                          max={g.ids.length}
                          ariaLabel={`Quantas unidades de ${g.nome} ficaram prontas`}
                        />
                      </div>
                      <button
                        className="pill"
                        disabled={concluir.isPending}
                        onClick={() =>
                          concluir.mutate(
                            g.ids.slice(0, Math.min(quantasProntas, g.ids.length)),
                          )
                        }
                      >
                        Concluir
                      </button>
                      <button className="pill ghost" onClick={() => setConcluindo(null)}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {reatribuindo && (
            <div
              className="card"
              style={{
                padding: '12px 14px',
                marginTop: 10,
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>Passar para</span>
              <span style={{ flex: 1, minWidth: 150 }}>
                <Select
                  ariaLabel="Nova responsável"
                  value={novoResp}
                  onChange={setNovoResp}
                  options={[
                    ['', 'Escolher…'],
                    ...(integrantes ?? []).map((p) => [p.id, p.nome] as [string, string]),
                  ]}
                />
              </span>
              <button
                className="pill"
                disabled={!novoResp || reatribuir.isPending}
                onClick={() => reatribuir.mutate(reatribuindo!.split(','))}
              >
                Passar
              </button>
              <button className="pill ghost" onClick={() => setReatribuindo(null)}>
                Cancelar
              </button>
            </div>
          )}
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
              + Adicionar unidades
            </div>
          )}
          {addAberto && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                marginTop: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ width: 110 }}>
                <Stepper
                  value={quantas}
                  onChange={setQuantas}
                  min={1}
                  max={50}
                  ariaLabel="Quantas unidades"
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <Select
                  ariaLabel="Responsável pelas unidades"
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
                  {receita.nome} <IconSetaLonga size={11} para="diagonal" />
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
