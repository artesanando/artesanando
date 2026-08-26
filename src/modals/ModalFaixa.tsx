import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl } from '../components/ui/bits'
import { ColorPicker } from '../components/ui/controles'
import { CampoMedida } from '../components/ui/CampoMedida'
import { PreviaFaixa } from '../components/ui/PreviaFaixa'
import { PreviaFaixas } from '../components/ui/PreviaFaixas'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita } from '../features/biblioteca/api'
import { fmtMedida, tamanhoManta } from '../lib/medida'
import { IconX } from '../components/ui/icons'
import { useFios } from '../features/estoque/useFios'
import { reordena, useReordenar } from '../components/ui/useReordenar'
import { IconArrastar } from '../components/ui/icons'

const botaoContador = (cor: string) => ({
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
  color: cor,
  padding: 0,
})

export function ModalFaixa() {
  const {
    faixaSeq,
    faixaCount,
    faixaSetColor,
    faixaSeqSet,
    faixaAdd,
    faixaRemover,
    incFaixa,
    decFaixa,
    setFaixaCount,
    backToProjeto,
  } = useStore()
  const { profile } = useAuth()
  const fios = useFios()
  const ordem = useReordenar((de, para) => faixaSeqSet(reordena(faixaSeq, de, para)))

  /* Puxar a borda de baixo muda quantas faixas a manta tem, como a grade do
     crochê já fazia. Cada ~9px arrastados vale uma faixa. */
  const arrasto = useRef<{ y: number; faixas: number } | null>(null)
  const alcaFaixas = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      arrasto.current = { y: e.clientY, faixas: faixaCount }
    },
    onPointerMove: (e: React.PointerEvent) => {
      const ini = arrasto.current
      if (!ini) return
      setFaixaCount(ini.faixas + Math.round((e.clientY - ini.y) / 9))
    },
    onPointerUp: () => {
      arrasto.current = null
    },
    onPointerCancel: () => {
      arrasto.current = null
    },
  }
  const qc = useQueryClient()
  const [nome, setNome] = useState('Novo padrão de faixa')
  const [medida, setMedida] = useState<{ largura: number | null; altura: number | null }>({
    largura: null,
    altura: null,
  })
  const [erro, setErro] = useState<string | null>(null)

  // a largura da faixa já é a largura da manta; a altura é o que empilha
  const daManta = tamanhoManta('manta_trico', 1, faixaCount, medida)

  const salvar = useMutation({
    mutationFn: () =>
      criarReceita({
        nome: nome.trim() || 'Faixa sem nome',
        categoria: 'faixa',
        sub: `faixa de tricô · ${faixaSeq.length} cores`,
        resumo: null,
        specs: [
          ['Faixas', String(faixaCount)],
          ['Cores', String(faixaSeq.length)],
          ...(daManta ? ([['Manta', fmtMedida(daManta)]] as [string, string][]) : []),
        ],
        largura_cm: medida.largura,
        altura_cm: medida.altura,
        conteudo: { seq: faixaSeq, faixas: faixaCount },
        origem: 'criador',
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receitas'] })
      backToProjeto()
    },
    onError: () => setErro('Não foi possível salvar o padrão.'),
  })

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader title="Adicionar à biblioteca" />
      <SeletorCategoria atual="faixa" />
      <Lbl style={{ marginBottom: 7 }}>NOME</Lbl>
      <input
        className="field"
        style={{ marginBottom: 18 }}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <Lbl style={{ marginBottom: 9 }}>SEQUÊNCIA DE CORES DA FAIXA</Lbl>
      <div style={{ marginBottom: 14 }}>
        {faixaSeq.map((c, i) => (
          <div
            key={i}
            data-i={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7,
              opacity: ordem.arrastado === i ? 0.4 : 1,
              outline: ordem.alvo === i && ordem.arrastado !== i ? '2px dashed var(--ink)' : 'none',
              outlineOffset: 2,
              borderRadius: 8,
            }}
          >
            <button
              type="button"
              aria-label={`Mover a cor ${i + 1}`}
              {...ordem.alca(i)}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'grab',
                color: 'var(--faint)',
                touchAction: 'none',
                display: 'flex',
              }}
            >
              <IconArrastar size={13} />
            </button>
            <span style={{ fontSize: 11, color: 'var(--muted)', width: 12, fontWeight: 800 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 130 }}>
              <ColorPicker
                fios={fios}
                value={c}
                ariaLabel={`Cor ${i + 1} da faixa`}
                onChange={(nova) => faixaSetColor(i, nova)}
              />
            </span>
            <button
              type="button"
              aria-label={`Remover a cor ${i + 1}`}
              disabled={faixaSeq.length <= 2}
              onClick={() => faixaRemover(i)}
              style={{
                border: 'none',
                background: 'none',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--faint)',
                cursor: faixaSeq.length <= 2 ? 'default' : 'pointer',
                opacity: faixaSeq.length <= 2 ? 0.4 : 1,
                padding: '0 4px',
              }}
            >
              <IconX size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="pill ghost"
          onClick={faixaAdd}
          style={{ fontSize: 12 }}
        >
          + Cor
        </button>
      </div>
      <Lbl style={{ marginBottom: 7 }}>QUANTIDADE DE FAIXAS</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div
          className="field"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: 120,
          }}
        >
          <button
            type="button"
            aria-label="Menos uma faixa"
            onClick={decFaixa}
            style={botaoContador('var(--faint)')}
          >
            −
          </button>
          {/* digitável: chegar a 40 faixas no botão de mais são 32 cliques */}
          <input
            aria-label="Quantidade de faixas"
            inputMode="numeric"
            value={faixaCount}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ''))
              if (n) setFaixaCount(n)
            }}
            style={{
              width: 44,
              border: 'none',
              background: 'none',
              textAlign: 'center',
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: 13,
              color: 'inherit',
              padding: 0,
            }}
          />
          <button
            type="button"
            aria-label="Mais uma faixa"
            onClick={incFaixa}
            style={botaoContador('var(--accent)')}
          >
            +
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <CampoMedida
          largura={medida.largura}
          altura={medida.altura}
          rotuloLargura="LARGURA DA FAIXA (CM)"
          rotuloAltura="ALTURA DA FAIXA (CM)"
          aoMudar={(patch) => setMedida((m) => ({ ...m, ...patch }))}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 9,
        }}
      >
        <Lbl>PRÉVIA DA FAIXA</Lbl>
        {daManta && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)' }}>
            manta com {faixaCount} faixas: {fmtMedida(daManta)}
          </span>
        )}
      </div>
      {/* a peça que ela vai tricotar, não a manta montada */}
      <div style={{ marginBottom: 22 }}>
        <PreviaFaixa seq={faixaSeq} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 9,
        }}
      >
        <Lbl>A MANTA MONTADA</Lbl>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          puxe a borda de baixo para mudar o número de faixas
        </span>
      </div>
      <div style={{ position: 'relative', paddingBottom: 14, marginBottom: 22 }}>
        <PreviaFaixas seq={faixaSeq} faixas={faixaCount} />
        <button
          type="button"
          className="alca-grade alca-y"
          aria-label={`Quantidade de faixas: ${faixaCount}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') incFaixa()
            if (e.key === 'ArrowUp') decFaixa()
          }}
          {...alcaFaixas}
        />
      </div>
      {erro && (
        <div
          role="alert"
          style={{
            background: 'var(--chip-soft)',
            border: '1px solid var(--chip-rose-border)',
            borderRadius: 10,
            padding: '9px 13px',
            fontSize: 12.5,
            color: 'var(--primary-dark)',
            marginBottom: 14,
          }}
        >
          {erro}
        </div>
      )}
      <div className="modal-rodape">
        <button className="pill ghost" onClick={backToProjeto}>
          Voltar
        </button>
        <button className="pill" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
          {salvar.isPending ? 'Salvando…' : 'Salvar padrão'}
        </button>
      </div>
    </ModalBox>
  )
}
