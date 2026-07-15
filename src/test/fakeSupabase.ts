/* Fake do módulo lib/supabase para os testes (vi.mock em App.test.tsx).
   Simula sessão, login por senha e as queries usadas pelo AuthProvider. */
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

export function __login() {
  currentSession = { user: { id: ADMIN_PROFILE.id } }
}

export function __reset() {
  currentSession = null
  listeners = []
}

export const supabaseConfigured = true
export function setKeepConnected() {}

/* builder encadeável mínimo: select/eq/order/update devolvem o próprio builder;
   single() e o thenable resolvem com o resultado configurado */
function builder(single: unknown, list: unknown[] = []) {
  const b = {
    select: () => b,
    eq: () => b,
    order: () => b,
    update: () => b,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: single, error: null }),
    then: (onOk: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: list, error: null }).then(onOk),
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
  from: (table: string) =>
    builder(table === 'profiles' ? ADMIN_PROFILE : null, []),
  rpc: async () => ({ data: 'regina@example.com', error: null }),
  functions: { invoke: async () => ({ data: { ok: true }, error: null }) },
}
