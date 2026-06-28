import type { CSSProperties } from 'react'
import { useStore } from '../state/store'
import { FieldSelect, Lbl } from '../components/ui/bits'
import { ModalBox, ModalFooter, ModalHeader } from './shared'

const box = (on: boolean, bg: string, bd: string, c: string): CSSProperties =>
  on
    ? {
        flex: 1,
        textAlign: 'center',
        padding: 12,
        borderRadius: 12,
        background: bg,
        border: `1px solid ${bd}`,
        fontWeight: 800,
        fontSize: 13.5,
        color: c,
        cursor: 'pointer',
      }
    : {
        flex: 1,
        textAlign: 'center',
        padding: 12,
        borderRadius: 12,
        border: '1px solid var(--field-border)',
        fontWeight: 700,
        fontSize: 13.5,
        color: 'var(--muted)',
        cursor: 'pointer',
      }

export function ModalFin() {
  const { finKind, setFinKind } = useStore()
  const entrada = finKind === 'entrada'

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader title="Nova movimentação" sub="Caixa do projeto · saldo atual R$ 1.240,50" />
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div
          onClick={() => setFinKind('entrada')}
          style={box(entrada, 'var(--chip-green)', 'var(--chip-green-border)', 'var(--green-dark)')}
        >
          ↑ Entrada
        </div>
        <div
          onClick={() => setFinKind('saida')}
          style={box(!entrada, 'var(--chip-soft)', 'var(--chip-rose-border)', 'var(--accent)')}
        >
          ↓ Saída
        </div>
      </div>
      <Lbl style={{ marginBottom: 7 }}>VALOR</Lbl>
      <div
        className="field h"
        style={{
          fontSize: 20,
          color: entrada ? 'var(--green-dark)' : 'var(--accent)',
          marginBottom: 18,
        }}
      >
        R$ 420,00
      </div>
      <Lbl style={{ marginBottom: 7 }}>DESCRIÇÃO</Lbl>
      <input
        className="field"
        style={{ marginBottom: 18 }}
        defaultValue="Bazar beneficente da faculdade"
      />
      <div className="grid2" style={{ marginBottom: 24 }}>
        <div>
          <Lbl style={{ marginBottom: 7 }}>CATEGORIA</Lbl>
          <FieldSelect>Doação</FieldSelect>
        </div>
        <div>
          <Lbl style={{ marginBottom: 7 }}>DATA</Lbl>
          <input className="field" defaultValue="08/07/2026" />
        </div>
      </div>
      <ModalFooter okLabel={entrada ? 'Registrar entrada' : 'Registrar saída'} />
    </ModalBox>
  )
}
