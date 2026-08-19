/* Tipos das tabelas do Supabase (M1). Quando o projeto estiver de pé,
   substituir por `supabase gen types typescript` mantendo estes aliases. */

export type Preferencia = 'croche' | 'trico' | 'ambos'
export type Papel = 'admin' | 'integrante'

export interface Profile {
  id: string
  /** conta do auth ligada a este perfil — null em integrante que só entra na chamada */
  user_id: string | null
  nome: string
  usuario: string
  email: string | null
  telefone: string | null
  preferencia: Preferencia
  avatar_color: string
  avatar_url: string | null
  papel: Papel
  ativo: boolean
  desde: string | null
}

/** Integrante anotada na chamada que ainda não tem acesso ao app */
export const semConta = (p: Pick<Profile, 'user_id'>) => p.user_id === null

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
  capa_path: string | null
  arquivado_em: string | null
}

export type MotivoMovimento = 'compra' | 'doacao' | 'ajuste' | 'perda' | 'venda'

export interface EstoqueMovimento {
  id: string
  item_id: string
  /** positivo entra, negativo sai */
  delta: number
  motivo: MotivoMovimento
  obs: string | null
  criado_por: string | null
  created_at: string
  autor?: { nome: string } | null
}

export const MOTIVO_LABEL: Record<MotivoMovimento, string> = {
  compra: 'Compra',
  doacao: 'Doação',
  ajuste: 'Ajuste de contagem',
  perda: 'Perda',
  venda: 'Venda',
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
  modelos?: Record<string, { border: string; inner: string; nome?: string }>
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
  video_url: string | null
  capa_path: string | null
  origem: 'manual' | 'criador'
  criado_por: string | null
  arquivado_em: string | null
}

/** Tabelas que o app arquiva em vez de apagar — chave usada em `pode_excluir` */
export type Arquivavel =
  | 'projetos'
  | 'encontros'
  | 'receitas'
  | 'estoque_itens'
  | 'movimentacoes'
  | 'profiles'

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: 'Administradora',
  integrante: 'Integrante',
}

export const PREFERENCIA_LABEL: Record<Preferencia, string> = {
  croche: 'Crochê',
  trico: 'Tricô',
  ambos: 'Crochê e tricô',
}
