import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { INTEGRANTE_PROFILE, __login, __reset } from './test/fakeSupabase'

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

  it('entra pelo login e mostra a pagina inicial', async () => {
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

describe('inicio (M5)', () => {
  it('deriva projetos em produção e atividade recente do banco', async () => {
    __login()
    renderAt('/')
    expect(await screen.findByText('Manta Primavera')).toBeInTheDocument()
    expect(await screen.findByText(/concluiu miolo Modelo A ×8/)).toBeInTheDocument()
    expect(screen.getByText('integrantes')).toBeInTheDocument()
  })
})

describe('navegação', () => {
  it('abre o modal de novo projeto pela pagina inicial', async () => {
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

  it('cada projeto tem menu com editar, marcar entregue e arquivar', async () => {
    __login()
    renderAt('/projetos')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Manta Primavera' }))
    expect(screen.getByRole('menuitem', { name: 'Editar ficha' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Marcar como entregue' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Arquivar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeInTheDocument()
  })

  it('integrante não vê as ações de estrutura do projeto', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/projetos')
    await screen.findByText('Manta Primavera')
    expect(
      screen.queryByRole('button', { name: 'Ações de Manta Primavera' }),
    ).not.toBeInTheDocument()
  })

  it('cada tipo de projeto abre a própria tela', async () => {
    __login()
    renderAt('/projetos/p1')
    expect(await screen.findByText('CROCHÊ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mapa de montagem' })).toBeInTheDocument()
  })

  it('polvo rosa abre o polvo, não a capivara', async () => {
    __login()
    renderAt('/projetos/p3')
    expect((await screen.findAllByText('Amigurumi Polvo Rosa')).length).toBeGreaterThan(0)
    expect(await screen.findByText(/#1–2 · Grace Hopper/)).toBeInTheDocument()
  })

  it('faixa feita fica somente-leitura para quem não pode reabrir', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/projetos/p2')
    expect(await screen.findByText('FEITA · SOMENTE LEITURA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Embaralhar ordem' })).toBeDisabled()
  })

  it('admin reabre faixa feita', async () => {
    __login()
    renderAt('/projetos/p2')
    expect(await screen.findByText('FEITA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Embaralhar ordem' })).toBeEnabled()
  })

  it('faixa a fazer pode ser pega por quem tem permissão de progresso', async () => {
    __login()
    renderAt('/projetos/p2')
    // F2 está como "a fazer" no fake
    await userEvent.click(await screen.findByRole('button', { name: /Faixa 2, a fazer/ }))
    expect(screen.getByRole('button', { name: 'Pegar faixa' })).toBeInTheDocument()
  })

  it('o mapa mostra a etapa de cada square', async () => {
    __login()
    renderAt('/projetos/p1')
    expect(
      await screen.findByRole('button', { name: /linha 1 coluna 1 · Pronto/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /linha 1 coluna 3 · Aguardando borda/ }),
    ).toBeInTheDocument()
  })

  it('selecionar squares no mapa abre a barra para marcar a etapa', async () => {
    __login()
    renderAt('/projetos/p1')
    await userEvent.click(await screen.findByRole('button', { name: /linha 1 coluna 4/ }))
    expect(screen.getByText('1 square selecionado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pronto' })).toBeInTheDocument()
  })

  it('integrante sem permissão de progresso não consegue marcar o mapa', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/projetos/p1')
    expect(await screen.findByRole('button', { name: /linha 1 coluna 4/ })).toBeDisabled()
  })
})

describe('estoque (M2)', () => {
  it('lista itens do banco e os empréstimos ativos', async () => {
    __login()
    renderAt('/estoque')
    expect(await screen.findByText('Círculo Balloon')).toBeInTheDocument()
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar devolução →' })).toBeInTheDocument()
  })

  it('a aba de agulhas não fala em ganchos', async () => {
    __login()
    renderAt('/estoque')
    await userEvent.click(await screen.findByRole('button', { name: 'Agulhas' }))
    expect(screen.getByText(/agulhas em estoque/)).toBeInTheDocument()
    expect(screen.queryByText(/ganchos/)).not.toBeInTheDocument()
  })

  it('cada material tem menu de ações com editar e movimentar', async () => {
    __login()
    renderAt('/estoque')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Círculo Balloon' }))
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Movimentar estoque' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Arquivar' })).toBeInTheDocument()
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
    expect(screen.getByText('Sahudy Montenegro')).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
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
