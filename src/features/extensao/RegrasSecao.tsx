import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Lbl, Stepper } from '../../components/ui/bits'
import { MenuKebab, Select } from '../../components/ui/controles'
import { useToast } from '../../components/ui/Toast'
import { useConfirmar } from '../../components/ui/Confirm'
import { IconX } from '../../components/ui/icons'
import { fetchSemestres } from '../../lib/semestre'
import { NIVEL_LABEL, type Nivel, type Semestre } from '../../types/database'
import { textoDoAlvo, TIPO_LABEL, type BlocoRegra, type TipoLinha } from './creditos'
import {
  copiarRegras,
  criarBloco,
  criarLinha,
  fetchRegras,
  removerBloco,
  removerLinha,
} from './creditosApi'
import { useLinhasDeCredito } from './useCredito'

/* Quem escreve a regra pensa em "5 squares OU 1 faixa", não em bloco e linha.
   O banco continua com `credito_blocos` e `credito_linhas`; o que mudou é o
   vocabulário da tela: exigência (E entre elas) e forma de cumprir (OU dentro
   de cada uma). */

const NIVEIS: Nivel[] = ['iniciante', 'experiente']

const TIPOS: [TipoLinha, string][] = (
  ['granny', 'faixa', 'amigurumi', 'feira', 'frequencia', 'mentoria'] as TipoLinha[]
).map((t) => [t, TIPO_LABEL[t]])

/* A quantidade acompanha o tipo: com um padrão fixo, trocar para frequência
   deixava "5 % de frequência" na tela. */
const PADRAO_QTD: Record<TipoLinha, number> = {
  granny: 5,
  faixa: 1,
  amigurumi: 3,
  feira: 2,
  frequencia: 75,
  mentoria: 1,
}

type Mudar = (acao: () => Promise<unknown>, aviso: string) => void

export function RegrasDoSemestre({ semestreId }: { semestreId: string | null }) {
  const qc = useQueryClient()
  const toast = useToast()

  const { data: regras } = useQuery({
    queryKey: ['regras-credito', semestreId],
    queryFn: () => fetchRegras(semestreId!),
    enabled: Boolean(semestreId),
  })
  const { data: semestres } = useQuery({ queryKey: ['semestres'], queryFn: fetchSemestres })
  const linhas = useLinhasDeCredito(semestreId)

  const mudar = useMutation({
    mutationFn: ({ acao }: { acao: () => Promise<unknown>; aviso: string }) => acao(),
    onSuccess: (_resultado, variaveis) => {
      qc.invalidateQueries({ queryKey: ['regras-credito', semestreId] })
      toast(variaveis.aviso)
    },
    onError: () => toast('Não foi possível salvar a regra.', 'erro'),
  })

  if (!semestreId) {
    return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Crie um semestre em Ajustes.</div>
  }

  /* Semestre logo antes do que está sendo editado — `fetchSemestres` devolve
     do mais novo para o mais velho, então é o vizinho de baixo. */
  const lista = semestres ?? []
  const anterior: Semestre | undefined = lista[lista.findIndex((s) => s.id === semestreId) + 1]

  return (
    <>
      <div className="h" style={{ fontSize: 17, marginBottom: 4 }}>
        Regras do semestre
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 26, maxWidth: 620 }}>
        Cada exigência precisa ser cumprida. Dentro de uma exigência, basta um dos caminhos
        listados.
      </div>

      {NIVEIS.map((nivel) => (
        <NivelRegra
          key={nivel}
          nivel={nivel}
          blocos={regras?.[nivel] ?? []}
          semestreId={semestreId}
          anterior={anterior}
          cumpriram={linhas.filter((l) => l.p.nivel === nivel && l.av.cumpriu).length}
          total={linhas.filter((l) => l.p.nivel === nivel).length}
          mudar={(acao, aviso) => mudar.mutate({ acao, aviso })}
        />
      ))}
    </>
  )
}

function NivelRegra({
  nivel,
  blocos,
  semestreId,
  anterior,
  cumpriram,
  total,
  mudar,
}: {
  nivel: Nivel
  blocos: BlocoRegra[]
  semestreId: string
  anterior: Semestre | undefined
  cumpriram: number
  total: number
  mudar: Mudar
}) {
  const confirmar = useConfirmar()
  const rotulo = NIVEL_LABEL[nivel].toLowerCase()

  const copiar = async () => {
    if (!anterior) return
    const ok = await confirmar({
      titulo: `Copiar as regras de ${anterior.label}?`,
      descricao:
        blocos.length > 0
          ? `As exigências que já estão aqui continuam — as de ${anterior.label} entram junto.`
          : undefined,
      okLabel: 'Copiar',
    })
    if (ok) mudar(() => copiarRegras(anterior.id, semestreId, nivel), 'Regras copiadas')
  }

  return (
    <section style={{ marginBottom: 34, maxWidth: 620 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <Lbl>{NIVEL_LABEL[nivel].toUpperCase()}</Lbl>
        {anterior && (
          <button
            type="button"
            className="pill ghost"
            style={{ padding: '5px 12px', fontSize: 11.5 }}
            onClick={copiar}
          >
            Copiar de {anterior.label}
          </button>
        )}
      </div>

      {blocos.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--field-border)',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 12.5,
            color: 'var(--muted)',
            lineHeight: 1.6,
            marginBottom: 10,
          }}
        >
          Sem exigência, o crédito de {rotulo} só sai à mão pela coordenação.
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 10 }}>
          Para ganhar o crédito, ela precisa de tudo isto:
        </div>
      )}

      {blocos.map((b, i) => (
        <div key={b.id}>
          {i > 0 && (
            <div
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--muted)',
                padding: '7px 0',
              }}
            >
              e também
            </div>
          )}
          <Exigencia bloco={b} indice={i} nivel={nivel} mudar={mudar} />
        </div>
      ))}

      <button
        type="button"
        className="pill ghost"
        style={{ padding: '7px 16px', fontSize: 12, marginTop: blocos.length > 0 ? 14 : 0 }}
        onClick={() =>
          mudar(() => criarBloco(semestreId, nivel, blocos.length), 'Exigência criada')
        }
      >
        + Exigência
      </button>

      {/* mexer na regra sem ver quem ela pega é escrever no escuro */}
      {total > 0 && blocos.length > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12 }}>
          Com esta regra, {cumpriram} de {total} {total === 1 ? 'integrante' : 'integrantes'} do
          nível {rotulo} já {cumpriram === 1 ? 'cumpriu' : 'cumpriram'}.
        </div>
      )}
    </section>
  )
}

function Exigencia({
  bloco,
  indice,
  nivel,
  mudar,
}: {
  bloco: BlocoRegra
  indice: number
  nivel: Nivel
  mudar: Mudar
}) {
  const confirmar = useConfirmar()
  const [abrindo, setAbrindo] = useState(false)

  /* Remover uma exigência leva junto todas as formas de cumprir dela: o banco
     cascateia. Era a única exclusão do app que não passava por confirmação. */
  const remover = async () => {
    const ok = await confirmar({
      titulo: `Remover a exigência ${indice + 1} de ${NIVEL_LABEL[nivel].toLowerCase()}?`,
      descricao:
        bloco.linhas.length > 0
          ? `As ${bloco.linhas.length} formas de cumprir dentro dela saem junto.`
          : undefined,
      okLabel: 'Remover',
      perigo: true,
    })
    if (ok) mudar(() => removerBloco(bloco.id), 'Exigência removida')
  }

  const removerForma = async (id: string, texto: string) => {
    const ok = await confirmar({
      titulo: `Tirar "${texto}" da exigência ${indice + 1}?`,
      okLabel: 'Tirar',
      perigo: true,
    })
    if (ok) mudar(() => removerLinha(id), 'Forma de cumprir removida')
  }

  return (
    <div
      style={{
        border: '1px solid var(--field-border)',
        borderRadius: 12,
        padding: '10px 12px 12px',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>
          EXIGÊNCIA {indice + 1}
        </span>
        <MenuKebab
          ariaLabel={`Ações da exigência ${indice + 1} de ${NIVEL_LABEL[nivel].toLowerCase()}`}
          acoes={[{ label: 'Remover', perigo: true, onSelect: remover }]}
        />
      </div>

      {bloco.linhas.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 4 }}>
          Nenhuma forma de cumprir ainda.
        </div>
      )}

      {bloco.linhas.map((l, j) => {
        const texto = textoDoAlvo(l.tipo, l.quantidade)
        return (
          <div
            key={l.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              padding: '3px 0',
            }}
          >
            <span style={{ flex: 1 }}>
              {/* o "ou" já diz que basta uma; não é preciso rotular a exigência */}
              {j > 0 && <span style={{ color: 'var(--muted)', fontWeight: 700 }}>ou </span>}
              {texto}
            </span>
            <button
              type="button"
              className="kebab"
              aria-label={`Tirar ${texto} da exigência ${indice + 1}`}
              onClick={() => removerForma(l.id, texto)}
            >
              <IconX />
            </button>
          </div>
        )
      })}

      {abrindo ? (
        <NovaForma
          aoAdicionar={(tipo, qtd) => {
            mudar(() => criarLinha(bloco.id, tipo, qtd), 'Forma de cumprir adicionada')
            setAbrindo(false)
          }}
          aoCancelar={() => setAbrindo(false)}
        />
      ) : (
        /* o formulário nasce fechado: montado em toda exigência, eram quatro
           abertos ao mesmo tempo, todos com o mesmo padrão de square */
        <button
          type="button"
          onClick={() => setAbrindo(true)}
          style={{
            border: 'none',
            background: 'none',
            padding: '5px 0 0',
            fontFamily: 'inherit',
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--accent)',
            cursor: 'pointer',
          }}
        >
          + outra forma de cumprir
        </button>
      )}
    </div>
  )
}

function NovaForma({
  aoAdicionar,
  aoCancelar,
}: {
  aoAdicionar: (tipo: TipoLinha, quantidade: number) => void
  aoCancelar: () => void
}) {
  const [tipo, setTipo] = useState<TipoLinha>('granny')
  const [qtd, setQtd] = useState(PADRAO_QTD.granny)
  // mentoria é marcada à mão pela coordenação, então não tem quantidade
  const semQuantidade = tipo === 'mentoria'

  const trocarTipo = (t: TipoLinha) => {
    setTipo(t)
    setQtd(PADRAO_QTD[t])
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid var(--divider)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ flex: 1, minWidth: 140 }}>
        <Select
          value={tipo}
          onChange={trocarTipo}
          options={TIPOS}
          ariaLabel="O que ela precisa fazer"
        />
      </span>
      {!semQuantidade && (
        <span style={{ width: 104 }}>
          <Stepper
            value={qtd}
            onChange={setQtd}
            min={1}
            max={tipo === 'frequencia' ? 100 : 99}
            ariaLabel="Quantidade"
          />
        </span>
      )}
      <button
        type="button"
        className="pill"
        style={{ padding: '7px 14px', fontSize: 12 }}
        onClick={() => aoAdicionar(tipo, semQuantidade ? 1 : qtd)}
      >
        Adicionar
      </button>
      <button
        type="button"
        className="pill ghost"
        style={{ padding: '7px 14px', fontSize: 12 }}
        onClick={aoCancelar}
      >
        Cancelar
      </button>
    </div>
  )
}
