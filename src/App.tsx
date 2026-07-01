import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './state/auth'
import { StoreProvider, useStore } from './state/store'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
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

function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useStore()
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
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
