import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './state/auth'
import { StoreProvider } from './state/store'
import { supabaseConfigured } from './lib/supabase'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { NovaSenhaPage } from './features/auth/NovaSenhaPage'
import { InicioPage } from './features/inicio/InicioPage'
import { ProjetosPage } from './features/projetos/ProjetosPage'
import { ProjetoDetalhePage } from './features/projetos/ProjetoDetalhePage'
import { IntegrantesPage } from './features/integrantes/IntegrantesPage'
import { EstoquePage } from './features/estoque/EstoquePage'
import { BibliotecaPage } from './features/biblioteca/BibliotecaPage'
import { PresencaPage } from './features/presenca/PresencaPage'
import { FinanceiroPage } from './features/financeiro/FinanceiroPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { ConfigPage } from './features/config/ConfigPage'
import { NotFoundPage } from './features/NotFoundPage'

function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      Carregando…
    </div>
  )
}

function SetupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ maxWidth: 520, padding: '28px 32px' }}>
        <div className="h" style={{ fontSize: 22, marginBottom: 10 }}>
          Falta configurar o Supabase
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
          Defina <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b> (no arquivo{' '}
          <code>.env</code> local ou nas variáveis de ambiente da Vercel) e recarregue. Os valores
          estão em <b>Project Settings → API</b> no painel do Supabase; veja o{' '}
          <code>.env.example</code>.
        </div>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Splash />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  if (!supabaseConfigured) return <SetupPage />

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <AppRoutes />
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

function AppRoutes() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/redefinir-senha" element={<NovaSenhaPage modo="redefinir" />} />
          <Route path="/definir-senha" element={<NovaSenhaPage modo="definir" />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<InicioPage />} />
            <Route path="/projetos" element={<ProjetosPage />} />
            <Route path="/projetos/:id" element={<ProjetoDetalhePage />} />
            <Route path="/integrantes" element={<IntegrantesPage />} />
            <Route path="/integrantes/:id" element={<IntegrantesPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/biblioteca" element={<BibliotecaPage />} />
            <Route path="/presenca" element={<PresencaPage />} />
            <Route path="/presenca/:encontroId" element={<PresencaPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route
              path="/configuracoes"
              element={
                <RequireAdmin>
                  <ConfigPage />
                </RequireAdmin>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StoreProvider>
    </AuthProvider>
  )
}
