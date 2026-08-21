import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { Lbl } from '../components/ui/bits'
import { ColorPicker } from '../components/ui/controles'
import { CampoMedida } from '../components/ui/CampoMedida'
import { PreviaFaixas } from '../components/ui/PreviaFaixas'
import { ModalBox, ModalHeader } from './shared'
import { SeletorCategoria } from './SeletorCategoria'
import { criarReceita } from '../features/biblioteca/api'
import { fmtMedida, tamanhoManta } from '../lib/medida'
import { IconX } from '../components/ui/icons'

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
    faixaAdd,
    faixaRemover,
    incFaixa,
    decFaixa,
    backToProjeto,
  } = useStore()
  const { profile } = useAuth()
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}
          >
            <span style={{ fontSize: 11, color: 'var(--muted)', width: 16, fontWeight: 800 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 130 }}>
              <ColorPicker
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
          <b>{faixaCount}</b>
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
        <Lbl>PRÉVIA DA MANTA</Lbl>
        {daManta && (
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--accent)' }}>
            {fmtMedida(daManta)}
          </span>
        )}
      </div>
      <div style={{ marginBottom: 22 }}>
        <PreviaFaixas seq={faixaSeq} faixas={faixaCount} />
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
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
