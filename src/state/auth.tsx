import { createContext, useContext, useState, type ReactNode } from 'react'

/* Auth mockada do M0 — vira Supabase Auth no M1 */

const KEY = 'artesanando:auth'

interface AuthCtx {
  auth: boolean
  login: () => void
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(() => sessionStorage.getItem(KEY) === '1')
  const login = () => {
    sessionStorage.setItem(KEY, '1')
    setAuth(true)
  }
  const logout = () => {
    sessionStorage.removeItem(KEY)
    setAuth(false)
  }
  return <Ctx.Provider value={{ auth, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
