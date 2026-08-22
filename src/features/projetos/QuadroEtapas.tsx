import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../state/auth'
import { AvatarPerfil } from '../../components/ui/AvatarPerfil'
import { useConfirmar, usePedirTexto } from '../../components/ui/Confirm'
import { useToast } from '../../components/ui/Toast'
import { useArrastarCartao } from '../../components/ui/useArrastarCartao'
import { SquareGranny, coresDoModelo } from '../../components/ui/SquareGranny'
import { fetchIntegrantes } from '../integrantes/api'
import {
  ETAPAS,
  ETAPA_LABEL,
  creditoQueFalta,
  creditoQueVolta,
  moverSquare,
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

/* Quem vai fazer um square não escolhe qual: pega "um do padrão A" da pilha e
 * começa. Por isso "A fazer" é uma pilha por padrão, com contagem — e o arrasto
 * é que dá identidade à peça, criando o cartão individual que carrega quem está
 * com ela. Terminada, ela volta a ser mais uma da pilha de prontos.
 *
 * As etapas do meio existem porque quem faz o miolo muitas vezes não sabe quem
 * fará a borda — às vezes nem tem o novelo da borda em mãos. "Aguardando borda"
 * é essa fila.
 */

/** Nas pontas a peça é indistinta; no meio ela tem dona */
const EMPILHA: SquareEtapa[] = ['afazer', 'pronto']

export function QuadroEtapas({
  projeto,
  squares,
  modelos,
}: {
  projeto: Projeto
  squares: Square[]
  modelos: MantaModelo[]
}) {
  const { profile, can } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const confirmar = useConfirmar()
  const perguntar = usePedirTexto()
  const podeEditar = can('progresso')

  const { data: pessoas } = useQuery({ queryKey: ['integrantes'], queryFn: fetchIntegrantes })
  const porModelo = new Map(modelos.map((m) => [m.id, m]))
  const porPessoa = new Map((pessoas ?? []).map((p) => [p.id, p]))
  const opcoes = (pessoas ?? []).map((p) => [p.id, p.nome] as [string, string])

  const mover = useMutation({
    mutationFn: (v: {
      square: Square
      etapa: SquareEtapa
      responsavelId?: string | null
      mioloPor?: string | null
      bordaPor?: string | null
    }) =>
      moverSquare({
        projetoId: projeto.id,
        square: v.square,
        etapa: v.etapa,
        responsavelId: v.responsavelId,
        mioloPor: v.mioloPor,
        bordaPor: v.bordaPor,
        autorId: profile!.id,
        quemNome:
          porPessoa.get(v.mioloPor ?? v.bordaPor ?? v.responsavelId ?? '')?.nome ?? null,
      }),
    /* Sem isso o cartão fica parado até a resposta chegar e o arrasto parece
       não ter pegado. */
    onMutate: (v) => {
      const chave = ['squares', projeto.id]
      const antes = qc.getQueryData<Square[]>(chave)
      qc.setQueryData<Square[]>(chave, (atual) =>
        (atual ?? []).map((s) => (s.id === v.square.id ? { ...s, etapa: v.etapa } : s)),
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
      qc.invalidateQueries({ queryKey: ['entregas-light'] })
    },
  })

  const perguntarQuem = (titulo: string, descricao: string, rotulo: string) =>
    perguntar({
      titulo,
      descricao,
      campo: { rotulo, opcoes, padrao: profile?.id, obrigatorio: true, placeholder: 'Escolher…' },
      okLabel: 'Registrar',
    })

  const quemEsta = (metade: 'miolo' | 'borda') =>
    perguntarQuem(
      metade === 'miolo' ? 'Quem vai fazer o miolo?' : 'Quem vai fazer a borda?',
      'Fica no cartão enquanto a peça estiver com ela. A entrega só conta quando a metade ficar pronta.',
      'QUEM PEGOU',
    )

  const quemFez = (metade: 'miolo' | 'borda') =>
    perguntarQuem(
      metade === 'miolo' ? 'Quem fez o miolo?' : 'Quem fez a borda?',
      'Vale meia entrega para ela no relatório do semestre.',
      'QUEM FEZ',
    )

  /* Ir para frente pode pedir quem fez; voltar apaga meia entrega de alguém, e
     isso ninguém deve fazer sem ver. */
  const aplicar = async (square: Square, etapa: SquareEtapa) => {
    if (square.etapa === etapa) return

    const volta = creditoQueVolta(square, etapa)
    if (volta.miolo || volta.borda) {
      const donos = [
        volta.miolo ? porPessoa.get(square.miolo_por ?? '')?.nome : null,
        volta.borda ? porPessoa.get(square.borda_por ?? '')?.nome : null,
      ].filter(Boolean)
      const ok = await confirmar({
        titulo: `Voltar para ${ETAPA_LABEL[etapa].toLowerCase()}?`,
        descricao: `A meia entrega de ${donos.join(' e ') || 'quem fez'} sai da conta do semestre.`,
        okLabel: 'Voltar',
        perigo: true,
      })
      if (!ok) return
    }

    /* Quem pegou a peça aparece no cartão; quem terminou a metade leva a meia
       entrega. Nem sempre é a mesma pessoa, e nem sempre no mesmo dia. */
    let responsavelId: string | null | undefined
    if ((etapa === 'miolo' || etapa === 'borda') && !square.responsavel_id) {
      responsavelId = await quemEsta(etapa === 'miolo' ? 'miolo' : 'borda')
      if (!responsavelId) return
    }

    const falta = creditoQueFalta(square, etapa)
    let mioloPor: string | null | undefined
    let bordaPor: string | null | undefined
    if (falta.miolo) {
      mioloPor = await quemFez('miolo')
      if (!mioloPor) return
    }
    if (falta.borda) {
      bordaPor = await quemFez('borda')
      if (!bordaPor) return
    }

    mover.mutate({ square, etapa, responsavelId, mioloPor, bordaPor })
  }

  /* Da pilha sai uma peça qualquer daquele padrão: a posição no mapa não diz
     nada sobre quem faz o quê, e escolher uma é só tirar a de cima. */
  const squareDoCartao = (cartaoId: string): Square | undefined => {
    const [tipo, chave, etapa] = cartaoId.split(':')
    return tipo === 'pilha'
      ? squares.find((s) => s.modelo_id === chave && s.etapa === etapa)
      : squares.find((s) => s.id === chave)
  }

  /* No toque, arrastar dentro de algo que também rola de lado é ruim — tocar
     no cartão escolhe a peça e a barra embaixo diz para onde ela vai. */
  const [escolhido, setEscolhido] = useState<string | null>(null)

  const { arrastado, alvo, clicar, propsArea } = useArrastarCartao({
    ativo: podeEditar,
    aoSoltar: (cartaoId, coluna) => {
      const square = squareDoCartao(cartaoId)
      setEscolhido(null)
      if (square) void aplicar(square, coluna as SquareEtapa)
    },
    aoClicar: (cartaoId) => setEscolhido((atual) => (atual === cartaoId ? null : cartaoId)),
  })

  const peca = escolhido ? squareDoCartao(escolhido) : undefined

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        {podeEditar
          ? 'Arraste uma peça para a etapa em que ela está. Ao chegar em “aguardando borda” e em “pronto”, o quadro pergunta quem fez a metade.'
          : 'Você não tem permissão para registrar progresso — fale com a administradora.'}
      </div>

      <div {...propsArea} className="quadro-etapas" style={{ touchAction: 'pan-x' }}>
        {ETAPAS.map((etapa) => {
          const daEtapa = squares.filter((s) => s.etapa === etapa)
          const empilhada = EMPILHA.includes(etapa)
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
                {empilhada
                  ? modelos
                      .map((m) => ({ m, n: daEtapa.filter((s) => s.modelo_id === m.id).length }))
                      .filter(({ n }) => n > 0)
                      .map(({ m, n }) => (
                        <Cartao
                          key={m.id}
                          id={`pilha:${m.id}:${etapa}`}
                          modelo={m}
                          arrastando={arrastado === `pilha:${m.id}:${etapa}`}
                          escolhido={escolhido === `pilha:${m.id}:${etapa}`}
                          podeEditar={podeEditar}
                          descricao={`${n} ${n === 1 ? 'peça' : 'peças'} do padrão ${m.letra} em ${ETAPA_LABEL[etapa].toLowerCase()}`}
                          aoClicar={clicar}
                        >
                          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            Padrão {m.letra}
                          </span>
                          <b style={{ fontSize: 13 }}>{n}</b>
                        </Cartao>
                      ))
                  : daEtapa.map((s) => {
                      const m = porModelo.get(s.modelo_id)
                      const dona = porPessoa.get(s.responsavel_id ?? s.miolo_por ?? '')
                      return (
                        <Cartao
                          key={s.id}
                          id={`square:${s.id}`}
                          modelo={m}
                          arrastando={arrastado === `square:${s.id}`}
                          escolhido={escolhido === `square:${s.id}`}
                          podeEditar={podeEditar}
                          descricao={`Peça do padrão ${m?.letra ?? '?'} em ${ETAPA_LABEL[
                            s.etapa
                          ].toLowerCase()}${dona ? ` · ${dona.nome}` : ''}`}
                          aoClicar={clicar}
                        >
                          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            Padrão {m?.letra ?? '?'}
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
                        </Cartao>
                      )
                    })}
              </div>
            </div>
          )
        })}
      </div>

      {peca && podeEditar && (
        <div
          className="card barra-acao"
          style={{ padding: '14px 16px', marginTop: 16, borderColor: 'var(--chip-rose-border)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 13 }}>Mover a peça escolhida para</b>
            <button
              type="button"
              onClick={() => setEscolhido(null)}
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
              Cancelar
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {ETAPAS.filter((e) => e !== peca.etapa).map((etapa) => {
              const proxima = ETAPAS.indexOf(etapa) === ETAPAS.indexOf(peca.etapa) + 1
              return (
                <button
                  key={etapa}
                  type="button"
                  className={proxima ? 'pill' : 'pill ghost'}
                  style={proxima ? undefined : { color: ETAPA_COR[etapa] }}
                  disabled={mover.isPending}
                  onClick={() => {
                    setEscolhido(null)
                    void aplicar(peca, etapa)
                  }}
                >
                  {ETAPA_LABEL[etapa]}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

function Cartao({
  id,
  modelo,
  arrastando,
  escolhido,
  podeEditar,
  descricao,
  aoClicar,
  children,
}: {
  id: string
  modelo: MantaModelo | undefined
  arrastando: boolean
  escolhido: boolean
  podeEditar: boolean
  descricao: string
  aoClicar: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-cartao={id}
      className="card cartao-square"
      aria-label={descricao}
      aria-pressed={escolhido}
      title={descricao}
      disabled={!podeEditar}
      onClick={() => aoClicar(id)}
      style={{
        opacity: arrastando ? 0.35 : 1,
        outline: escolhido ? '2px solid var(--ink)' : 'none',
        outlineOffset: -2,
        cursor: podeEditar ? 'grab' : 'default',
      }}
    >
      {modelo && (
        <SquareGranny
          cores={coresDoModelo(modelo)}
          tamanho={18}
          radius={3}
          style={{ flex: 'none' }}
        />
      )}
      {children}
    </button>
  )
}
