import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useArrastarCartao } from '../../components/ui/useArrastarCartao'
import { SquareGranny, coresDoModelo } from '../../components/ui/SquareGranny'
import { coordenada } from '../../lib/grade'
import { fetchIntegrantes } from '../integrantes/api'
import {
  ETAPAS,
  ETAPA_LABEL,
  marcarSquares,
  type MantaModelo,
  type Projeto,
  type Square,
  type SquareEtapa,
} from './api'

export const ETAPA_COR: Record<SquareEtapa, string> = {
  afazer: 'var(--faint-2)',
  miolo: 'var(--blue-dark)',
  aguardando_borda: 'var(--gold-dark)',
  borda: 'var(--lilac)',
  pronto: 'var(--green-dark)',
}

/* O quadro tinha a forma de um kanban e não era um: cinco colunas com cartões
 * que não arrastavam, não clicavam, e que nem eram squares — eram contagens por
 * modelo. Quem entrava ali só podia voltar.
 *
 * Agora é um cartão por square, arrastável entre as etapas, e cada cartão diz
 * quem está com ele — a pergunta que o mapa não responde ("quem está com os
 * quatro aguardando borda?").
 */
export function QuadroEtapas({
  projeto,
  squares,
  modelos,
  colunas,
}: {
  projeto: Projeto
  squares: Square[]
  modelos: MantaModelo[]
  colunas: number
}) {
  const { profile, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const podeEditar = can('progresso')

  const [sel, setSel] = useState<Set<string>>(new Set())
  const [respId, setRespId] = useState('')

  const { data: pessoas } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const porModelo = new Map(modelos.map((m) => [m.id, m]))
  const porPessoa = new Map((pessoas ?? []).map((p) => [p.id, p]))

  const mover = useMutation({
    mutationFn: ({ ids, etapa }: { ids: string[]; etapa: SquareEtapa }) =>
      marcarSquares({
        projetoId: projeto.id,
        ids,
        etapa,
        responsavelId: respId || profile!.id,
        responsavelNome: (respId ? porPessoa.get(respId)?.nome : profile!.nome) ?? null,
        autorId: profile!.id,
      }),
    /* Sem isso o cartão volta para a coluna de origem até a resposta chegar, e
       o arrasto parece que não pegou. */
    onMutate: ({ ids, etapa }) => {
      const chave = ['squares', projeto.id]
      const antes = qc.getQueryData<Square[]>(chave)
      qc.setQueryData<Square[]>(chave, (atual) =>
        (atual ?? []).map((s) => (ids.includes(s.id) ? { ...s, etapa } : s)),
      )
      return { chave, antes }
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(ctx.chave, ctx.antes)
      toast('Não foi possível mover.', 'erro')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['squares', projeto.id] })
      qc.invalidateQueries({ queryKey: ['atividades', projeto.id] })
      qc.invalidateQueries({ queryKey: ['progresso-geral'] })
    },
  })

  /* Arrastar um cartão selecionado leva todos os selecionados: tirar doze
     squares de "A fazer" um a um são doze arrastos. */
  const aplicar = (ids: string[], etapa: SquareEtapa) => {
    const mudam = squares.filter((s) => ids.includes(s.id) && s.etapa !== etapa).map((s) => s.id)
    if (mudam.length === 0) return
    mover.mutate({ ids: mudam, etapa })
    setSel(new Set())
  }

  const alternar = (id: string) =>
    setSel((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })

  const { arrastado, alvo, clicar, propsArea } = useArrastarCartao({
    ativo: podeEditar,
    aoSoltar: (cartaoId, coluna) =>
      aplicar(sel.has(cartaoId) ? [...sel] : [cartaoId], coluna as SquareEtapa),
    aoClicar: alternar,
  })

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {/* sem este seletor todo arrasto creditaria quem está logada — quase
            sempre a coordenação, que não fez o square */}
        <span className="lbl">QUEM FEZ</span>
        <span style={{ minWidth: 200 }}>
          <Select
            ariaLabel="Quem fez"
            value={respId}
            onChange={setRespId}
            disabled={!podeEditar}
            options={[
              ['', 'Quem fez… (eu)'],
              ...(pessoas ?? []).map((p) => [p.id, p.nome] as [string, string]),
            ]}
          />
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {podeEditar
            ? 'arraste um square para outra etapa, ou selecione vários e escolha a etapa'
            : 'você não tem permissão para registrar progresso — fale com a administradora'}
        </span>
      </div>

      <div {...propsArea} className="quadro-etapas" style={{ touchAction: 'pan-x' }}>
        {ETAPAS.map((etapa) => {
          const daEtapa = squares.filter((s) => s.etapa === etapa)
          return (
            <div
              key={etapa}
              data-coluna={etapa}
              className="coluna-etapa"
              style={{
                outline: alvo === etapa ? `2px dashed ${ETAPA_COR[etapa]}` : 'none',
                outlineOffset: -2,
              }}
            >
              <div className="cabecalho-etapa" style={{ color: ETAPA_COR[etapa] }}>
                <span>{ETAPA_LABEL[etapa].toUpperCase()}</span>
                <span>{daEtapa.length}</span>
              </div>
              <div className="cartoes-etapa">
                {daEtapa.length === 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--faint)', padding: '2px 2px 6px' }}>
                    —
                  </div>
                )}
                {daEtapa.map((s) => {
                  const m = porModelo.get(s.modelo_id)
                  const dona = s.responsavel_id ? porPessoa.get(s.responsavel_id) : undefined
                  const { linha, coluna } = coordenada(s.posicao, colunas)
                  const descricao = `Square linha ${linha} coluna ${coluna} · ${
                    ETAPA_LABEL[s.etapa]
                  }${dona ? ` · ${dona.nome}` : ''}`
                  return (
                    <button
                      key={s.id}
                      type="button"
                      data-cartao={s.id}
                      className="card cartao-square"
                      aria-label={descricao}
                      aria-pressed={sel.has(s.id)}
                      title={descricao}
                      disabled={!podeEditar}
                      onClick={() => clicar(s.id)}
                      style={{
                        opacity: arrastado === s.id ? 0.35 : 1,
                        outline: sel.has(s.id) ? '2px solid var(--ink)' : 'none',
                        outlineOffset: -2,
                        cursor: podeEditar ? 'grab' : 'default',
                      }}
                    >
                      {m && (
                        <SquareGranny
                          cores={coresDoModelo(m)}
                          tamanho={18}
                          radius={3}
                          style={{ flex: 'none' }}
                        />
                      )}
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        L{linha} C{coluna}
                      </span>
                      {dona && (
                        <AvatarPerfil
                          nome={dona.nome}
                          avatarColor={dona.avatar_color}
                          avatarUrl={dona.avatar_url}
                          size={18}
                          fontSize={8}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* o caminho sem arrastar — no toque, arrastar dentro de algo que também
          rola na horizontal é ruim */}
      {sel.size > 0 && podeEditar && (
        <div
          className="card barra-acao"
          style={{ padding: '14px 16px', marginTop: 16, borderColor: 'var(--chip-rose-border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13 }}>
              {sel.size} square{sel.size > 1 ? 's' : ''} selecionado{sel.size > 1 ? 's' : ''}
            </b>
            <button
              type="button"
              onClick={() => setSel(new Set())}
              style={{
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--muted)',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Limpar
            </button>
          </div>
          <BotoesEtapa
            squares={squares.filter((s) => sel.has(s.id))}
            pendente={mover.isPending}
            aoEscolher={(etapa) => aplicar([...sel], etapa)}
          />
        </div>
      )}
    </>
  )
}

/* A próxima etapa vem preenchida e as outras recuam: cinco botões de mesmo peso
   não diziam qual era o caminho normal. */
export function BotoesEtapa({
  squares,
  pendente,
  aoEscolher,
}: {
  squares: Square[]
  pendente: boolean
  aoEscolher: (etapa: SquareEtapa) => void
}) {
  const proxima = proximaEtapa(squares)
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      {ETAPAS.map((etapa) => {
        const destaque = etapa === proxima
        return (
          <button
            key={etapa}
            type="button"
            className={destaque ? 'pill' : 'pill ghost'}
            style={
              destaque
                ? undefined
                : { borderColor: 'var(--field-border)', color: ETAPA_COR[etapa] }
            }
            disabled={pendente}
            onClick={() => aoEscolher(etapa)}
          >
            {ETAPA_LABEL[etapa]}
          </button>
        )
      })}
    </div>
  )
}

/** A etapa seguinte à mais atrasada da seleção — nada além de "pronto" */
export function proximaEtapa(squares: Square[]): SquareEtapa | undefined {
  if (squares.length === 0) return undefined
  const atrasada = Math.min(...squares.map((s) => ETAPAS.indexOf(s.etapa)))
  return ETAPAS[Math.min(atrasada + 1, ETAPAS.length - 1)]
}
