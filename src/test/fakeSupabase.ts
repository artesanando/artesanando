/* Fake do módulo lib/supabase para os testes (vi.mock em App.test.tsx).
   Simula sessão, login por senha e as queries usadas pelas telas. */
import type { Profile } from '../types/database'

type Listener = (event: string, session: unknown) => void

let listeners: Listener[] = []
let currentSession: { user: { id: string } } | null = null

export const ADMIN_PROFILE: Profile = {
  id: 'u1',
  nome: 'Cândida Nunes',
  usuario: 'candida.prof',
  telefone: null,
  preferencia: 'ambos',
  avatar_color: '#C4798A',
  papel: 'admin',
  ativo: true,
  desde: '2024.1',
}

const ESTOQUE_FAKE = [
  {
    id: 'i1',
    categoria: 'novelos',
    nome: 'Círculo Balloon',
    detalhe: 'rosé',
    cor_hex: '#DFA2AC',
    quantidade: 20,
    vendidos: 0,
    minimo: 5,
    custo_centavos: null,
  },
  {
    id: 'i2',
    categoria: 'agulhas',
    nome: 'Agulha de crochê',
    detalhe: '4,0 mm',
    cor_hex: null,
    quantidade: 11,
    vendidos: 0,
    minimo: 2,
    custo_centavos: null,
  },
]

const EMPRESTIMOS_FAKE = [
  {
    id: 'e1',
    item_id: 'i1',
    integrante_id: 'u2',
    projeto_nome: 'Manta Primavera',
    quantidade: 2,
    data: '2026-06-30',
    encerrado_em: null,
    devolucoes: [],
    integrante: { nome: 'Ada Lovelace' },
    item: { nome: 'Círculo Balloon', detalhe: 'rosé', cor_hex: '#DFA2AC', categoria: 'novelos' },
  },
]

const RECEITAS_FAKE = [
  {
    id: 'r1',
    nome: 'Capivara da Lú',
    categoria: 'amigurumi',
    sub: 'fio 4 mm · 3 pág',
    resumo: 'Capivara de amigurumi em fio marrom.',
    specs: [['Fio', '4 mm']],
    conteudo: {},
    pdf_path: null,
    origem: 'manual',
    criado_por: 'u1',
  },
  {
    id: 'r2',
    nome: 'Granny Flor de Maio',
    categoria: 'granny',
    sub: '4 carreiras · 2 pág',
    resumo: 'Granny quadrado de 4 carreiras.',
    specs: [['Carreiras', '4']],
    conteudo: {
      rings: [
        { c: '#E3C07A', name: 'Amarelo', n: 1, role: 'miolo' },
        { c: '#7D9B76', name: 'Sálvia', n: 1, role: 'borda' },
      ],
    },
    pdf_path: 'r2.pdf',
    origem: 'manual',
    criado_por: 'u1',
  },
]

const TABLES: Record<string, { single: unknown; list: unknown[] }> = {
  profiles: { single: ADMIN_PROFILE, list: [ADMIN_PROFILE] },
  estoque_itens: { single: ESTOQUE_FAKE[0], list: ESTOQUE_FAKE },
  emprestimos: { single: EMPRESTIMOS_FAKE[0], list: EMPRESTIMOS_FAKE },
  devolucoes: { single: null, list: [] },
  receitas: { single: RECEITAS_FAKE[0], list: RECEITAS_FAKE },
  permissoes: { single: null, list: [] },
  semestres: { single: null, list: [] },
}

export function __login() {
  currentSession = { user: { id: ADMIN_PROFILE.id } }
}

export function __reset() {
  currentSession = null
  listeners = []
}

export const supabaseConfigured = true
export function setKeepConnected() {}

/* builder encadeável mínimo: filtros devolvem o próprio builder;
   single() e o thenable resolvem com os dados fake da tabela */
function builder(table: string) {
  const data = TABLES[table] ?? { single: null, list: [] }
  const b = {
    select: () => b,
    eq: () => b,
    is: () => b,
    order: () => b,
    insert: () => b,
    update: () => b,
    delete: () => b,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: data.single, error: null }),
    then: (onOk: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: data.list, error: null }).then(onOk),
  }
  return b
}

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: currentSession } }),
    onAuthStateChange: (cb: Listener) => {
      listeners.push(cb)
      return { data: { subscription: { unsubscribe() {} } } }
    },
    signInWithPassword: async ({ password }: { email: string; password: string }) => {
      if (password === '12345678') {
        __login()
        listeners.forEach((cb) => cb('SIGNED_IN', currentSession))
        return { data: {}, error: null }
      }
      return { data: {}, error: { message: 'Invalid login credentials' } }
    },
    signOut: async () => {
      currentSession = null
      listeners.forEach((cb) => cb('SIGNED_OUT', null))
      return { error: null }
    },
    updateUser: async () => ({ data: {}, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
  },
  from: (table: string) => builder(table),
  rpc: async () => ({ data: 'candida@example.com', error: null }),
  functions: { invoke: async () => ({ data: { ok: true }, error: null }) },
  storage: {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: 'about:blank' }, error: null }),
    }),
  },
}
