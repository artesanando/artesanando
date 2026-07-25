import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { __login, __reset } from './test/fakeSupabase'

vi.mock('./lib/supabase', () => import('./test/fakeSupabase'))

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  __reset()
  localStorage.clear()
  sessionStorage.clear()
})

describe('auth', () => {
  it('mostra a tela de login quando não autenticada', async () => {
    renderAt('/')
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('entra pelo login e mostra o dashboard', async () => {
    renderAt('/login')
    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'candida.prof')
    await userEvent.type(screen.getByLabelText('Senha'), '12345678')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Boa tarde, Cândida')).toBeInTheDocument()
  })

  it('senha errada mostra erro e não loga', async () => {
    renderAt('/login')
    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'candida.prof')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos')
    expect(screen.queryByText('Boa tarde, Cândida')).not.toBeInTheDocument()
  })

  it('sidebar mostra a usuária logada', async () => {
    __login()
    renderAt('/')
    expect(await screen.findByText('Cândida Nunes')).toBeInTheDocument()
    expect(screen.getByText('Administradora')).toBeInTheDocument()
  })
})

describe('navegação', () => {
  it('deep-link /projetos/primavera abre a manta de crochê', async () => {
    __login()
    renderAt('/projetos/primavera')
    expect(
      await screen.findByText(
        'Destino: Hospital Infantil · 80 squares · padrões A/B/C · 5 integrantes',
      ),
    ).toBeInTheDocument()
  })

  it('abre o modal de novo projeto pelo dashboard', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    expect(screen.getByText('Defina o tipo para configurar a produção')).toBeInTheDocument()
  })

  it('rota desconhecida cai no 404', async () => {
    __login()
    renderAt('/nao-existe')
    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument()
  })
})

describe('estoque (M2)', () => {
  it('lista itens do banco e os empréstimos ativos', async () => {
    __login()
    renderAt('/estoque')
    expect(await screen.findByText('Círculo Balloon')).toBeInTheDocument()
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Registrar devolução →')).toBeInTheDocument()
  })
})

describe('biblioteca (M2)', () => {
  it('lista receitas do banco', async () => {
    __login()
    renderAt('/biblioteca')
    expect(await screen.findByText('Capivara da Lú')).toBeInTheDocument()
    expect(screen.getByText('Granny Flor de Maio')).toBeInTheDocument()
  })

  it('busca filtra as receitas', async () => {
    __login()
    renderAt('/biblioteca')
    await screen.findByText('Capivara da Lú')
    await userEvent.type(screen.getByLabelText('Buscar receita ou padrão'), 'granny')
    expect(screen.queryByText('Capivara da Lú')).not.toBeInTheDocument()
    expect(screen.getByText('Granny Flor de Maio')).toBeInTheDocument()
  })

  it('abre o detalhe da receita ao clicar no card', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByText('Granny Flor de Maio'))
    expect(await screen.findByText('GRANNY SQUARE')).toBeInTheDocument()
    expect(screen.getByText('CARREIRAS')).toBeInTheDocument()
  })
})
