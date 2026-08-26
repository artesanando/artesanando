import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth, type Perm } from './state/auth'
import { StoreProvider } from './state/store'
import { supabaseConfigured } from './lib/supabase'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ui/Toast'
import { ConfirmProvider } from './components/ui/Confirm'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { AcessoPage } from './features/auth/AcessoPage'
import { CadastroPage } from './features/auth/CadastroPage'
import { AuthShell } from './features/auth/AuthShell'
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
import { ExtensaoPage } from './features/extensao/ExtensaoPage'
import { NotFoundPage } from './features/NotFoundPage'
import { MuralPage } from './features/mural/MuralPage'

function Splash() {
  return (
    <div
      style={{
        minHeight: '100dvh',
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
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
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

/* Sessão de pé e perfil que não veio era `<Splash />` para sempre: recarregar
   caía na mesma tela, porque a sessão fica guardada. A saída é sair. */
function SemPerfil() {
  const { logout } = useAuth()
  return (
    <AuthShell>
      <div className="h" style={{ fontWeight: 500, fontSize: 22, marginBottom: 4 }}>
        Não foi possível abrir seu perfil
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
        Fale com a administradora.
      </div>
      <button
        type="button"
        className="pill"
        onClick={logout}
        style={{ width: '100%', padding: 13, fontSize: 14 }}
      >
        Sair
      </button>
    </AuthShell>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, semPerfil } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  if (semPerfil) return <SemPerfil />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

/* Quem não tem a permissão nem vê o item no menu; a guarda fecha a porta de
   quem digitar a rota na mão. */
function RequirePerm({ perm, children }: { perm: Perm; children: ReactNode }) {
  const { can } = useAuth()
  if (!can(perm)) return <Navigate to="/" replace />
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
          <Route path="/acesso" element={<AcessoPage />} />
          {/* sem entrada no menu: chega-se por ela pelo link que vai no grupo */}
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<InicioPage />} />
            <Route path="/mural" element={<MuralPage />} />
            <Route path="/projetos" element={<ProjetosPage />} />
            <Route path="/projetos/:id" element={<ProjetoDetalhePage />} />
            <Route path="/integrantes" element={<IntegrantesPage />} />
            <Route path="/integrantes/:id" element={<IntegrantesPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/biblioteca" element={<BibliotecaPage />} />
            <Route path="/presenca" element={<PresencaPage />} />
            <Route path="/presenca/:encontroId" element={<PresencaPage />} />
            <Route
              path="/financeiro"
              element={
                <RequirePerm perm="financeiro">
                  <FinanceiroPage />
                </RequirePerm>
              }
            />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route
              path="/configuracoes"
              element={
                <RequireAdmin>
                  <ConfigPage />
                </RequireAdmin>
              }
            />
            <Route
              path="/extensao"
              element={
                <RequireAdmin>
                  <ExtensaoPage />
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
