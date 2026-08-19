import { supabase } from '../../lib/supabase'

export interface Movimentacao {
  id: string
  data: string
  descricao: string
  categoria: string
  tipo: 'entrada' | 'saida'
  valor_centavos: number
  criado_por: string | null
  arquivado_em: string | null
}

export async function fetchMovimentacoes(): Promise<Movimentacao[]> {
  const { data, error } = await supabase
    .from('movimentacoes')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return (data ?? []) as Movimentacao[]
}

export async function atualizarMovimentacao(
  id: string,
  patch: Partial<Omit<Movimentacao, 'id' | 'criado_por' | 'arquivado_em'>>,
) {
  const { error } = await supabase.from('movimentacoes').update(patch).eq('id', id)
  if (error) throw error
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

/** Recorte por intervalo de datas ISO, ambas as pontas incluídas */
export function filtraPeriodo<T extends Pick<Movimentacao, 'data'>>(
  movs: T[],
  de: string,
  ate: string,
): T[] {
  return movs.filter((m) => m.data >= de && m.data <= ate)
}

/** Total do tipo dentro de uma lista já recortada, em centavos */
export function totalDoTipo(
  movs: Pick<Movimentacao, 'tipo' | 'valor_centavos'>[],
  tipo: 'entrada' | 'saida',
): number {
  return movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.valor_centavos, 0)
}

/** Primeiro e último dia do mês de uma data ISO */
export function limitesDoMes(iso: string): { de: string; ate: string } {
  const [ano, mes] = iso.split('-').map(Number)
  const ultimo = new Date(ano, mes, 0).getDate()
  const mm = String(mes).padStart(2, '0')
  return { de: `${ano}-${mm}-01`, ate: `${ano}-${mm}-${String(ultimo).padStart(2, '0')}` }
}
