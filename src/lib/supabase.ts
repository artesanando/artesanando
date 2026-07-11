import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false enquanto o .env não tiver as chaves — o App mostra a tela de setup */
export const supabaseConfigured = Boolean(url && anon)

const KEEP_KEY = 'artesanando:keep'

/** "Manter conectada": marcado = localStorage (sobrevive ao fechar o navegador),
    desmarcado = sessionStorage (sessão morre com a aba). Chamar ANTES do signIn. */
export function setKeepConnected(keep: boolean) {
  localStorage.setItem(KEEP_KEY, keep ? '1' : '0')
}

const keep = () => localStorage.getItem(KEEP_KEY) !== '0'

const dynamicStorage = {
  getItem: (k: string) => (keep() ? localStorage : sessionStorage).getItem(k),
  setItem: (k: string, v: string) => (keep() ? localStorage : sessionStorage).setItem(k, v),
  removeItem: (k: string) => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  },
}

export const supabase = createClient(url ?? 'http://localhost:54321', anon ?? 'anon-key', {
  auth: {
    storage: dynamicStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
