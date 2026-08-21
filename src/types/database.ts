/* Tipos das tabelas do Supabase (M1). Quando o projeto estiver de pé,
   substituir por `supabase gen types typescript` mantendo estes aliases. */

export type Preferencia = 'croche' | 'trico' | 'ambos'
export type Papel = 'admin' | 'integrante'

/** Define qual regra de crédito do semestre vale para ela */
export type Nivel = 'iniciante' | 'experiente'

export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  experiente: 'Experiente',
}

/* Mesmo caso do turno: enquanto a migration do nível não roda, `select('*')`
   devolve a linha sem a coluna, e o app usa isso como chave de objeto. */
export const nivelDaPessoa = (v: unknown): Nivel => (v === 'experiente' ? 'experiente' : 'iniciante')

/** RA: seis dígitos, e só isso — cada instituição tem o seu formato, este é o daqui */
export const RA_VALIDO = /^[0-9]{6}$/

/** Turno de um encontro; a integrante pode ser dos dois */
export type TurnoEncontro = 'diurno' | 'noturno'
export type Turno = TurnoEncontro | 'ambos'

export const TURNO_LABEL: Record<Turno, string> = {
  diurno: 'Diurno',
  noturno: 'Noturno',
  ambos: 'Os dois turnos',
}

/* `select('*')` devolve a linha sem a coluna enquanto a migration do turno não
   rodou, e o app usa esse valor como chave de objeto — sem normalizar aqui, a
   tela quebrava inteira em vez de só perder a separação por turno. */
export const turnoDaPessoa = (v: unknown): Turno =>
  v === 'diurno' || v === 'noturno' ? v : 'ambos'

export const turnoDoEncontro = (v: unknown): TurnoEncontro =>
  v === 'noturno' ? 'noturno' : 'diurno'

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
  /** em qual turno ela vem — define o denominador da frequência total dela */
  turno: Turno
  nivel: Nivel
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

export type EstoqueCategoria = 'novelos' | 'agulhas' | 'outros' | 'feira'

export interface EstoqueItem {
  id: string
  categoria: EstoqueCategoria
  nome: string
  detalhe: string | null
  cor_hex: string | null
  quantidade: number
  vendidos: number
  custo_centavos: number | null
  capa_path: string | null
  arquivado_em: string | null
}

/* O app só grava 'entrada' e 'saida'. Os cinco antigos continuam aqui porque o
   histórico é imutável e as linhas já gravadas precisam seguir legíveis. */
export type MotivoMovimento =
  | 'entrada'
  | 'saida'
  | 'compra'
  | 'doacao'
  | 'ajuste'
  | 'perda'
  | 'venda'

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
  entrada: 'Entrada',
  saida: 'Saída',
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
  /** tamanho esperado da peça, em cm — o projeto herda daqui */
  largura_cm: number | null
  altura_cm: number | null
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
