import { useState, type CSSProperties, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '../state/store'
import { useAuth } from '../state/auth'
import { CurrencyField, Lbl } from '../components/ui/bits'
import { DatePicker, Select } from '../components/ui/controles'
import { ModalBox, ModalHeader } from './shared'
import { criarMovimentacao, fetchMovimentacoes, saldo } from '../features/financeiro/api'
import { fmtCentavos, hojeIso } from '../lib/format'

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

const CATEGORIAS: [string, string][] = [
  ['doacao', 'Doação'],
  ['material', 'Material'],
  ['feira', 'Feira/Bazar'],
  ['outros', 'Outros'],
]

export function ModalFin() {
  const { finKind, setFinKind, close } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const entrada = finKind === 'entrada'

  const { data: movs } = useQuery({ queryKey: ['movimentacoes'], queryFn: fetchMovimentacoes })

  const [valor, setValor] = useState(0)
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('doacao')
  const [data, setData] = useState(hojeIso())
  const [erro, setErro] = useState<string | null>(null)

  const salvar = useMutation({
    mutationFn: () =>
      criarMovimentacao({
        data,
        descricao: descricao.trim(),
        categoria,
        tipo: finKind,
        valor_centavos: valor,
        criado_por: profile!.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movimentacoes'] })
      close()
    },
    onError: () => setErro('Não foi possível registrar a movimentação.'),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (valor <= 0) {
      setErro('Informe um valor maior que zero.')
      return
    }
    if (!descricao.trim()) {
      setErro('Descreva a movimentação.')
      return
    }
    salvar.mutate()
  }

  return (
    <ModalBox maxWidth={520}>
      <ModalHeader
        title="Nova movimentação"
        sub={`Caixa do projeto · saldo atual ${fmtCentavos(saldo(movs ?? []))}`}
      />
      <form onSubmit={submit}>
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
        <div style={{ marginBottom: 18 }}>
          <CurrencyField
            centavos={valor}
            onChange={setValor}
            color={entrada ? 'var(--green-dark)' : 'var(--accent)'}
          />
        </div>
        <Lbl style={{ marginBottom: 7 }}>DESCRIÇÃO</Lbl>
        <input
          className="field"
          style={{ marginBottom: 18 }}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Bazar beneficente da faculdade"
        />
        <div className="grid2" style={{ marginBottom: 24 }}>
          <div>
            <Lbl style={{ marginBottom: 7 }}>CATEGORIA</Lbl>
            <Select
              ariaLabel="Categoria"
              value={categoria}
              onChange={setCategoria}
              options={CATEGORIAS}
            />
          </div>
          <div>
            <Lbl style={{ marginBottom: 7 }}>DATA</Lbl>
            <DatePicker value={data} onChange={setData} ariaLabel="Data da movimentação" />
          </div>
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
          <button type="button" className="pill ghost" onClick={close}>
            Cancelar
          </button>
          <button type="submit" className="pill" disabled={salvar.isPending}>
            {salvar.isPending
              ? 'Registrando…'
              : entrada
                ? 'Registrar entrada'
                : 'Registrar saída'}
          </button>
        </div>
      </form>
    </ModalBox>
  )
}
