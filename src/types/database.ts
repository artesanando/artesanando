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

export const PAPEL_LABEL: Record<Papel, string> = {
  admin: 'Administradora',
  integrante: 'Integrante',
}

export const PREFERENCIA_LABEL: Record<Preferencia, string> = {
  croche: 'Crochê',
  trico: 'Tricô',
  ambos: 'Crochê e tricô',
}
