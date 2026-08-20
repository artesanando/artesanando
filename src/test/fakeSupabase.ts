/* Fake do módulo lib/supabase para os testes (vi.mock em App.test.tsx).
   Simula sessão, login por senha e as queries usadas pelas telas. */
import type { Profile } from '../types/database'

type Listener = (event: string, session: unknown) => void

let listeners: Listener[] = []
let currentSession: { user: { id: string } } | null = null

export const ADMIN_PROFILE: Profile = {
  id: 'u1',
  user_id: 'u1',
  nome: 'Cândida Nunes',
  usuario: 'candida.prof',
  email: 'candida@example.com',
  telefone: null,
  preferencia: 'ambos',
  avatar_color: '#C4798A',
  avatar_url: null,
  papel: 'admin',
  ativo: true,
  turno: 'ambos',
  desde: '2024.1',
}

/* segunda professora — os registros de admin se alternam entre as duas */
export const ADMIN2_PROFILE: Profile = {
  id: 'u7',
  user_id: 'u7',
  nome: 'Sahudy Montenegro',
  usuario: 'sahudy.prof',
  email: 'sahudy@example.com',
  telefone: null,
  preferencia: 'ambos',
  avatar_color: '#7D9B76',
  avatar_url: null,
  papel: 'admin',
  ativo: true,
  turno: 'ambos',
  desde: '2024.1',
}

/* integrante sem nenhuma permissão marcada — usada para cobrir o que
   depende de papel/responsável (faixa feita, botões bloqueados) */
export const INTEGRANTE_PROFILE: Profile = {
  id: 'u2',
  user_id: 'u2',
  nome: 'Ada Lovelace',
  usuario: 'ada.lovelace',
  email: 'ada@example.com',
  telefone: null,
  preferencia: 'croche',
  avatar_color: '#A9BFA3',
  avatar_url: null,
  papel: 'integrante',
  ativo: true,
  turno: 'ambos',
  desde: '2025.1',
}

/* anotada só na chamada: existe como perfil, mas ainda não tem conta */
export const SEM_CONTA_PROFILE: Profile = {
  id: 'u8',
  user_id: null,
  nome: 'Hedy Lamarr',
  usuario: 'hedy.lamarr',
  email: null,
  telefone: null,
  preferencia: 'trico',
  avatar_color: '#B99BC4',
  avatar_url: null,
  papel: 'integrante',
  ativo: true,
  turno: 'ambos',
  desde: '2026.2',
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
    custo_centavos: null,
    arquivado_em: null,
  },
  {
    id: 'i2',
    categoria: 'agulhas',
    nome: 'Agulha de crochê',
    detalhe: '4,0 mm',
    cor_hex: null,
    quantidade: 11,
    vendidos: 0,
    custo_centavos: null,
    arquivado_em: null,
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
    arquivado_em: null,
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
    arquivado_em: null,
  },
]

const PROJETOS_FAKE = [
  {
    id: 'p1',
    semestre_id: null,
    nome: 'Manta Primavera',
    tipo: 'manta_croche',
    destino: 'Hospital Infantil',
    emoji: '🌸',
    receita_id: null,
    meta: null,
    status: 'ativo',
    created_by: 'u1',
    arquivado_em: null,
  },
  {
    id: 'p2',
    semestre_id: null,
    nome: 'Manta Nuvem',
    tipo: 'manta_trico',
    destino: 'Hospital Infantil',
    emoji: '☁️',
    receita_id: null,
    meta: null,
    status: 'ativo',
    created_by: 'u1',
    arquivado_em: null,
  },
  {
    id: 'p3',
    semestre_id: null,
    nome: 'Polvo Rosa',
    tipo: 'amigurumi',
    destino: 'Maternidade',
    emoji: '🐙',
    receita_id: 'r1',
    meta: 20,
    status: 'ativo',
    created_by: 'u1',
    arquivado_em: null,
  },
]

const MODELOS_FAKE = [
  {
    id: 'm1',
    projeto_id: 'p1',
    letra: 'A',
    nome: 'Modelo A — Flor de Maio',
    cor_borda: '#C4798A',
    cor_miolo: '#DFA2AC',
    responsavel_id: null,
    total: 4,
    responsavel: null,
  },
]

const SQUARES_FAKE = [
  { id: 's1', projeto_id: 'p1', modelo_id: 'm1', posicao: 0, etapa: 'pronto', responsavel_id: 'u2' },
  { id: 's2', projeto_id: 'p1', modelo_id: 'm1', posicao: 1, etapa: 'pronto', responsavel_id: 'u2' },
  {
    id: 's3',
    projeto_id: 'p1',
    modelo_id: 'm1',
    posicao: 2,
    etapa: 'aguardando_borda',
    responsavel_id: 'u4',
  },
  { id: 's4', projeto_id: 'p1', modelo_id: 'm1', posicao: 3, etapa: 'afazer', responsavel_id: null },
]

const FAIXAS_FAKE = [
  {
    id: 'f1',
    projeto_id: 'p2',
    ordem: 1,
    responsavel_id: 'u3',
    status: 'feita',
    cores: ['#ECD97C', '#A9BFA3', '#DFA2AC'],
    responsavel: { nome: 'Alan Turing', avatar_color: '#C9B98F' },
  },
  {
    id: 'f2',
    projeto_id: 'p2',
    ordem: 2,
    responsavel_id: 'u2',
    status: 'afazer',
    cores: ['#A9BFA3', '#ECD97C', '#DFA2AC'],
    responsavel: { nome: 'Ada Lovelace', avatar_color: '#A9BFA3' },
  },
]

const UNIDADES_FAKE = [
  {
    id: 'un1',
    projeto_id: 'p3',
    numero: 1,
    responsavel_id: 'u4',
    status: 'concluida',
    responsavel: { nome: 'Grace Hopper' },
  },
  {
    id: 'un2',
    projeto_id: 'p3',
    numero: 2,
    responsavel_id: 'u4',
    status: 'em_producao',
    responsavel: { nome: 'Grace Hopper' },
  },
  {
    id: 'un3',
    projeto_id: 'p3',
    numero: 3,
    responsavel_id: 'u4',
    status: 'em_producao',
    responsavel: { nome: 'Grace Hopper' },
  },
]

const COMENTARIOS_FAKE = [
  {
    id: 'c1',
    projeto_id: 'p1',
    autor_id: 'u5',
    texto: 'Peguei as bordas do Modelo A 👍',
    created_at: '2026-07-14T12:00:00Z',
    autor: { nome: 'Edsger Dijkstra', avatar_color: '#7D9B76' },
  },
]

const ATIVIDADES_FAKE = [
  {
    id: 'a1',
    autor_id: 'u6',
    tipo: 'producao',
    projeto_id: 'p1',
    payload: { texto: 'concluiu miolo Modelo A ×8', detalhe: '→ aguardando borda' },
    created_at: '2026-07-14T12:00:00Z',
    autor: { nome: 'Barbara Liskov' },
  },
]

const ENCONTROS_FAKE = [
  {
    id: 'en1',
    semestre_id: null,
    data: '2026-07-07',
    hora: '14:00',
    local: 'Sala 203',
    pauta: 'Bordas do Modelo A',
    turno: 'diurno',
    cancelado_em: null,
    serie_id: null,
    arquivado_em: null,
  },
  {
    id: 'en2',
    semestre_id: null,
    data: '2099-07-14',
    hora: '14:00',
    local: 'Sala 203',
    pauta: 'Montagem da Manta Ada',
    turno: 'noturno',
    cancelado_em: null,
    serie_id: null,
    arquivado_em: null,
  },
]

const PRESENCAS_FAKE = [
  { encontro_id: 'en1', integrante_id: 'u1', presente: true, marcado_por: 'u1' },
  { encontro_id: 'en1', integrante_id: 'u7', presente: true, marcado_por: 'u7' },
  { encontro_id: 'en1', integrante_id: 'u2', presente: true, marcado_por: 'u7' },
]

const MOVIMENTACOES_FAKE = [
  {
    id: 'mv1',
    data: '2026-07-08',
    descricao: 'Bazar beneficente',
    categoria: 'doacao',
    tipo: 'entrada',
    valor_centavos: 42000,
    criado_por: 'u7',
    arquivado_em: null,
  },
  {
    id: 'mv2',
    data: '2026-07-05',
    descricao: '12 novelos Círculo Balloon',
    categoria: 'material',
    tipo: 'saida',
    valor_centavos: 24000,
    criado_por: 'u1',
    arquivado_em: null,
  },
]

const TABLES: Record<string, { single: unknown; list: unknown[] }> = {
  profiles: {
    single: ADMIN_PROFILE,
    list: [ADMIN_PROFILE, ADMIN2_PROFILE, INTEGRANTE_PROFILE, SEM_CONTA_PROFILE],
  },
  estoque_itens: { single: ESTOQUE_FAKE[0], list: ESTOQUE_FAKE },
  emprestimos: { single: EMPRESTIMOS_FAKE[0], list: EMPRESTIMOS_FAKE },
  devolucoes: { single: null, list: [] },
  receitas: { single: RECEITAS_FAKE[0], list: RECEITAS_FAKE },
  permissoes: { single: null, list: [] },
  semestres: { single: null, list: [] },
  projetos: { single: PROJETOS_FAKE[0], list: PROJETOS_FAKE },
  manta_modelos: { single: MODELOS_FAKE[0], list: MODELOS_FAKE },
  squares: { single: SQUARES_FAKE[0], list: SQUARES_FAKE },
  faixas: { single: FAIXAS_FAKE[0], list: FAIXAS_FAKE },
  estoque_movimentos: { single: null, list: [] },
  unidades: { single: UNIDADES_FAKE[0], list: UNIDADES_FAKE },
  comentarios: { single: COMENTARIOS_FAKE[0], list: COMENTARIOS_FAKE },
  atividades: { single: ATIVIDADES_FAKE[0], list: ATIVIDADES_FAKE },
  encontros: { single: ENCONTROS_FAKE[0], list: ENCONTROS_FAKE },
  presencas: { single: PRESENCAS_FAKE[0], list: PRESENCAS_FAKE },
  movimentacoes: { single: MOVIMENTACOES_FAKE[0], list: MOVIMENTACOES_FAKE },
  arquivos_extensao: { single: null, list: [] },
}

export function __login(profile: Profile = ADMIN_PROFILE) {
  currentSession = { user: { id: profile.id } }
}

export function __reset() {
  currentSession = null
  listeners = []
}

export const supabaseConfigured = true
export function setKeepConnected() {}

/* builder encadeável mínimo: filtros devolvem o próprio builder;
   single() resolve a linha filtrada por eq/id e o thenable resolve a
   lista filtrada pelos eq() acumulados */
function builder(table: string) {
  const data = TABLES[table] ?? { single: null, list: [] }
  const filtros: [string, unknown][] = []
  const filtrada = () =>
    data.list.filter((row) =>
      filtros.every(([k, v]) => (row as Record<string, unknown>)[k] === v),
    )
  const b = {
    select: () => b,
    eq: (col: string, val: unknown) => {
      filtros.push([col, val])
      return b
    },
    is: () => b,
    in: () => b,
    order: () => b,
    limit: () => b,
    insert: () => b,
    update: () => b,
    upsert: () => b,
    delete: () => b,
    maybeSingle: async () => ({
      data: filtros.length > 0 ? (filtrada()[0] ?? null) : data.single,
      error: null,
    }),
    single: async () => {
      const hit = filtros.length > 0 ? (filtrada()[0] ?? null) : data.single
      return hit ? { data: hit, error: null } : { data: null, error: { message: 'não achou' } }
    },
    then: (onOk: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: filtrada(), error: null }).then(onOk),
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
