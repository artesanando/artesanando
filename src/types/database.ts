/* Tipos das tabelas do Supabase (M1). Quando o projeto estiver de pé,
   substituir por `supabase gen types typescript` mantendo estes aliases. */

export type Preferencia = 'croche' | 'trico' | 'ambos'
export type Papel = 'admin' | 'integrante'

export interface Profile {
  id: string
  nome: string
  usuario: string
  telefone: string | null
  preferencia: Preferencia
  avatar_color: string
  papel: Papel
  ativo: boolean
  desde: string | null
}

export interface Permissoes {
  profile_id: string
  progresso: boolean
  devolucoes: boolean
  comentarios: boolean
  financeiro: boolean
}

export interface Semestre {
  id: string
  label: string
  inicio: string | null
  fim: string | null
  ativo: boolean
}

export type EstoqueCategoria = 'novelos' | 'agulhas' | 'olhos' | 'enchimento' | 'feira'

export interface EstoqueItem {
  id: string
  categoria: EstoqueCategoria
  nome: string
  detalhe: string | null
  cor_hex: string | null
  quantidade: number
  vendidos: number
  minimo: number
  custo_centavos: number | null
}

export interface Emprestimo {
  id: string
  item_id: string
  integrante_id: string
  projeto_nome: string | null
  quantidade: number
  data: string
  encerrado_em: string | null
}

export interface Devolucao {
  id: string
  emprestimo_id: string
  quantidade: number
  data: string
}

export type ReceitaCategoria = 'amigurumi' | 'granny' | 'faixa' | 'manta'

export interface ReceitaConteudo {
  rings?: { c: string; name: string; n: number; role?: string }[]
  seq?: string[]
  materiais?: { c: string; name: string; qty: string }[]
  paleta?: { c: string; name: string }[]
  montagem?: string[]
  esquema?: string[][]
  faixas?: number
  cells?: string[][]
  modelos?: Record<string, { border: string; inner: string }>
}

export interface Receita {
  id: string
  nome: string
  categoria: ReceitaCategoria
  sub: string | null
  resumo: string | null
  specs: [string, string][]
  conteudo: ReceitaConteudo
  pdf_path: string | null
  origem: 'manual' | 'criador'
  criado_por: string | null
}

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: 'Administradora',
  integrante: 'Integrante',
}

export const PREFERENCIA_LABEL: Record<Preferencia, string> = {
  croche: 'Crochê',
  trico: 'Tricô',
  ambos: 'Crochê e tricô',
}
