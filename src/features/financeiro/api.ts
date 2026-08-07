import { supabase } from '../../lib/supabase'

export interface Movimentacao {
  id: string
  data: string
  descricao: string
  categoria: string
  tipo: 'entrada' | 'saida'
  valor_centavos: number
  criado_por: string | null
}

export async function fetchMovimentacoes(): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return (data ?? []) as Movimentacao[]
}

export async function criarMovimentacao(m: {
  data: string
  descricao: string
  categoria: string
  tipo: 'entrada' | 'saida'
  valor_centavos: number
  criado_por: string
}) {
  const { error } = await supabase.from('movimentacoes').insert(m)
  if (error) throw error
}

/* ---------- KPIs derivados (unit-testados) ---------- */

const sinal = (m: Pick<Movimentacao, 'tipo' | 'valor_centavos'>) =>
  m.tipo === 'entrada' ? m.valor_centavos : -m.valor_centavos

/** Saldo do caixa em centavos (todas as movimentações) */
export function saldo(movs: Pick<Movimentacao, 'tipo' | 'valor_centavos'>[]): number {
  return movs.reduce((s, m) => s + sinal(m), 0)
}

/** Total do tipo no mês de referência ('YYYY-MM'), em centavos */
export function totalDoMes(
  movs: Pick<Movimentacao, 'tipo' | 'valor_centavos' | 'data'>[],
  tipo: 'entrada' | 'saida',
  mesRef: string,
): number {
  return movs
    .filter((m) => m.tipo === tipo && m.data.startsWith(mesRef))
    .reduce((s, m) => s + m.valor_centavos, 0)
}
