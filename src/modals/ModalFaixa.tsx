import { useStore } from '../state/store'
import { Lbl } from '../components/ui/bits'
import { ModalBox, ModalHeader } from './shared'

export function ModalFaixa() {
  const { faixaSeq, faixaCount, faixaCycle, faixaAdd, faixaDrop, incFaixa, decFaixa, backToProjeto } =
    useStore()

  const rowH = Math.max(5, Math.round(150 / faixaCount))

  return (
    <ModalBox maxWidth={560}>
      <ModalHeader
        title="Padrão das faixas de tricô"
        sub="Cada faixa repete a mesma sequência de cores · toque numa célula para trocar a cor"
      />
      <Lbl style={{ marginBottom: 9 }}>SEQUÊNCIA DE CORES DA FAIXA</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid var(--field-border)',
          }}
        >
          {faixaSeq.map((c, i) => (
            <div
              key={i}
              onClick={() => faixaCycle(i)}
              style={{ width: 36, height: 34, background: c, cursor: 'pointer' }}
            />
          ))}
        </div>
        <span
          onClick={faixaDrop}
          style={{
            cursor: 'pointer',
            color: 'var(--faint)',
            fontWeight: 800,
            fontSize: 18,
            padding: '0 4px',
          }}
        >
          −
        </span>
        <span
          onClick={faixaAdd}
          style={{
            cursor: 'pointer',
            color: 'var(--accent)',
            fontWeight: 800,
            fontSize: 18,
            padding: '0 4px',
          }}
        >
          +
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
        A sequência se repete ao longo da largura da manta.
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
          <span
            onClick={decFaixa}
            style={{ cursor: 'pointer', color: 'var(--faint)', fontWeight: 800 }}
          >
            −
          </span>
          <b>{faixaCount}</b>
          <span
            onClick={incFaixa}
            style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 800 }}
          >
            +
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          uma faixa = uma linha inteira, feita por uma integrante
        </span>
      </div>
      <Lbl style={{ marginBottom: 9 }}>PRÉVIA DA MANTA</Lbl>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          background: 'var(--sand)',
          padding: 8,
          borderRadius: 8,
          marginBottom: 22,
        }}
      >
        {Array.from({ length: faixaCount }, (_, i) => (
          <div key={i} style={{ display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
            {faixaSeq.map((c, j) => (
              <div key={j} style={{ flex: 1, height: rowH, background: c }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="pill ghost" onClick={backToProjeto}>
          Voltar
        </button>
        <button className="pill" onClick={backToProjeto}>
          Salvar padrão
        </button>
      </div>
    </ModalBox>
  )
}
