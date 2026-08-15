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
    expect(await screen.findByText(/, Cândida$/)).toBeInTheDocument()
  })

  it('senha errada mostra erro e não loga', async () => {
    renderAt('/login')
    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'candida.prof')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos')
    expect(screen.queryByText(/, Cândida$/)).not.toBeInTheDocument()
  })

  it('sidebar mostra a usuária logada', async () => {
    __login()
    renderAt('/')
    expect(await screen.findByText('Cândida Nunes')).toBeInTheDocument()
    expect(screen.getByText('Administradora')).toBeInTheDocument()
  })
})

describe('dashboard (M5)', () => {
  it('deriva projetos em produção e atividade recente do banco', async () => {
    __login()
    renderAt('/')
    expect(await screen.findByText('Manta Primavera')).toBeInTheDocument()
    expect(await screen.findByText(/concluiu miolo Modelo A ×8/)).toBeInTheDocument()
    expect(screen.getByText('integrantes')).toBeInTheDocument()
  })
})

describe('navegação', () => {
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

describe('projetos (M3)', () => {
  it('lista os projetos do banco', async () => {
    __login()
    renderAt('/projetos')
    expect(await screen.findByText('Manta Primavera')).toBeInTheDocument()
    expect(screen.getByText('Manta Nuvem')).toBeInTheDocument()
    expect(screen.getByText('Polvo Rosa')).toBeInTheDocument()
  })

  it('cada tipo de projeto abre a própria tela', async () => {
    __login()
    renderAt('/projetos/p1')
    expect(await screen.findByText('CROCHÊ')).toBeInTheDocument()
    expect(screen.getByText('Fluxo por etapa')).toBeInTheDocument()
  })

  it('polvo rosa abre o polvo, não a capivara', async () => {
    __login()
    renderAt('/projetos/p3')
    expect((await screen.findAllByText('Amigurumi Polvo Rosa')).length).toBeGreaterThan(0)
    expect(await screen.findByText(/#1–2 · Grace Hopper/)).toBeInTheDocument()
  })

  it('faixa feita fica somente-leitura', async () => {
    __login()
    renderAt('/projetos/p2')
    expect(await screen.findByText('FEITA · SOMENTE LEITURA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Embaralhar ordem' })).toBeDisabled()
  })

  it('lote sem responsável mostra o pegar lote', async () => {
    __login()
    renderAt('/projetos/p1')
    expect(await screen.findByText('Pegar lote')).toBeInTheDocument()
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

describe('financeiro (M4)', () => {
  it('deriva o saldo e lista as movimentações', async () => {
    __login()
    renderAt('/financeiro')
    expect(await screen.findByText('R$ 180,00')).toBeInTheDocument()
    expect(screen.getByText('Bazar beneficente')).toBeInTheDocument()
    expect(screen.getByText(/− 240,00/)).toBeInTheDocument()
  })
})

describe('presença (M4)', () => {
  it('mostra o próximo encontro e a chamada do último', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText('PRÓXIMO ENCONTRO')).toBeInTheDocument()
    expect(await screen.findByLabelText('Marcar presença de Cândida Nunes')).toBeInTheDocument()
  })
})

describe('integrantes (M4)', () => {
  it('lista integrantes reais e mostra o painel derivado', async () => {
    __login()
    renderAt('/integrantes')
    expect(await screen.findByText(/@candida\.prof/)).toBeInTheDocument()
    expect(screen.getByText('ENTREGAS NO SEMESTRE')).toBeInTheDocument()
    expect(screen.getByText('FREQUÊNCIA')).toBeInTheDocument()
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
