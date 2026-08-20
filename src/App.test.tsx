import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ADMIN_PROFILE, INTEGRANTE_PROFILE, __login, __reset } from './test/fakeSupabase'

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
    expect(screen.getByRole('dialog', { name: 'Novo projeto' })).toBeInTheDocument()
  })

  it('a manta de crochê deixa de nascer pronta: dá para escolher tamanho e modelos', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    expect(screen.getByLabelText('Colunas')).toBeInTheDocument()
    expect(screen.getByLabelText('Linhas')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome do modelo A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar um esquema salvo' })).toBeInTheDocument()
  })

  it('nome vazio no projeto mostra o erro sob o campo', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar projeto' }))
    expect(await screen.findByText('Dê um nome ao projeto.')).toBeInTheDocument()
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
    // o que já foi entregue aparece separado do que ainda está em produção,
    // contado em peças — a numeração das unidades não vai mais para a tela
    expect(await screen.findByText(/1 unidade · Grace Hopper/)).toBeInTheDocument()
    expect(await screen.findByText(/2 unidades · Grace Hopper/)).toBeInTheDocument()
  })

  it('unidade de amigurumi pode ser reatribuída ou removida', async () => {
    __login()
    renderAt('/projetos/p3')
    const menus = await screen.findAllByRole('button', {
      name: /Ações das unidades de Grace Hopper/,
    })
    await userEvent.click(menus[0])
    expect(screen.getByRole('menuitem', { name: 'Reatribuir' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Remover' })).toBeInTheDocument()
  })

  it('concluir amigurumi abre o contador de quantas ficaram prontas', async () => {
    __login()
    renderAt('/projetos/p3')
    await userEvent.click(await screen.findByRole('button', { name: 'Concluir ✓' }))
    const contador = screen.getByRole('spinbutton', {
      name: /Quantas unidades de Grace Hopper ficaram prontas/,
    })
    // começa nas 2 pendentes e dá para baixar para 1
    expect(contador).toHaveAttribute('aria-valuenow', '2')
    await userEvent.click(screen.getByRole('button', { name: 'Diminuir' }))
    expect(contador).toHaveAttribute('aria-valuenow', '1')
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
  it('mostra os próximos encontros e a chamada do último', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText('Próximos encontros')).toBeInTheDocument()
    expect(await screen.findByLabelText('Marcar presença de Cândida Nunes')).toBeInTheDocument()
  })

  it('o encontro futuro traz o turno junto da data', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText(/Noturno/)).toBeInTheDocument()
  })

  it('dá para editar, cancelar e arquivar um encontro', async () => {
    __login()
    renderAt('/presenca')
    await userEvent.click(await screen.findByRole('button', { name: /Ações do encontro de 07 jul/ }))
    expect(screen.getByRole('menuitem', { name: 'Editar encontro' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Cancelar encontro' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Arquivar' })).toBeInTheDocument()
  })

  it('o encontro novo escolhe o turno e pode repetir toda semana', async () => {
    __login()
    renderAt('/presenca')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo encontro' }))
    expect(screen.getByRole('button', { name: 'Noturno' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Repete toda semana/)).toBeInTheDocument()
  })

  it('quem só entrou na chamada aparece marcada como sem perfil', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText('Hedy Lamarr')).toBeInTheDocument()
    expect(screen.getByText('SEM PERFIL')).toBeInTheDocument()
  })

  it('admin pode anotar alguém que ainda não tem perfil', async () => {
    __login()
    renderAt('/presenca')
    expect(
      await screen.findByRole('button', { name: '+ Alguém que ainda não tem perfil' }),
    ).toBeInTheDocument()
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
    expect(screen.getByText(/FREQUÊNCIA ·/)).toBeInTheDocument()
  })

  it('as entregas passam a contar granny squares', async () => {
    __login()
    renderAt('/integrantes')
    expect(await screen.findByText('Granny squares prontos')).toBeInTheDocument()
  })

  it('avisa quem ainda precisa ser vinculada a um perfil', async () => {
    __login()
    renderAt('/integrantes')
    expect(await screen.findByText(/1 pessoa na chamada.* ainda sem/s)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Juntar a outra' })).toBeInTheDocument()
  })
})

describe('configurações', () => {
  it('as abas Semestre e Encontros deixaram de ser placeholder', async () => {
    __login()
    renderAt('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Semestre' }))
    expect(screen.getByText('Semestre do projeto')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Encontros' }))
    expect(screen.getByText('Encontros do semestre')).toBeInTheDocument()
  })

  it('administradora aparece na tabela de permissões, mas travada', async () => {
    __login()
    renderAt('/configuracoes')
    const chave = await screen.findByRole('switch', { name: 'FINANCEIRO de Cândida Nunes' })
    expect(chave).toBeDisabled()
    expect(chave).toBeChecked()
  })

  it('integrante comum não chega em configurações', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/configuracoes')
    expect(await screen.findByText(/, Ada$/)).toBeInTheDocument()
  })
})

describe('perfil', () => {
  it('mostra o email da conta, que antes não aparecia em lugar nenhum', async () => {
    __login()
    renderAt('/perfil')
    expect(await screen.findByText('candida@example.com')).toBeInTheDocument()
  })

  it('oferece adicionar foto quando ainda não há nenhuma', async () => {
    __login()
    renderAt('/perfil')
    expect(await screen.findByRole('button', { name: 'Adicionar foto' })).toBeInTheDocument()
  })

  it('nome vazio mostra o erro embaixo do campo', async () => {
    __login()
    renderAt('/perfil')
    const nome = await screen.findByLabelText(/NOME COMPLETO/)
    await userEvent.clear(nome)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByText('O nome não pode ficar vazio.')).toBeInTheDocument()
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

  it('nome vazio na receita mostra o erro sob o campo', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar na biblioteca' }))
    expect(await screen.findByText('Dê um nome à receita.')).toBeInTheDocument()
  })

  it('a categoria troca o editor sem sair do fluxo', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esquema de manta' }))
    expect(await screen.findByRole('button', { name: 'Salvar esquema' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Granny square' }))
    expect(await screen.findByRole('button', { name: 'Salvar padrão' })).toBeInTheDocument()
  })
})

describe('empréstimo (M2)', () => {
  it('integrante e material vazios mostram erro sob cada campo', async () => {
    __login()
    renderAt('/estoque')
    await userEvent.click(await screen.findByRole('button', { name: '+ Empréstimo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar empréstimo' }))
    expect(await screen.findByText('Escolha a integrante.')).toBeInTheDocument()
    expect(screen.getByText('Escolha o material.')).toBeInTheDocument()
  })
})

describe('financeiro — modal', () => {
  it('valor zero e descrição vazia mostram erro sob cada campo', async () => {
    __login()
    renderAt('/financeiro')
    await userEvent.click(await screen.findByRole('button', { name: '↑ Entrada' }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }))
    expect(await screen.findByText('Informe um valor maior que zero.')).toBeInTheDocument()
    expect(screen.getByText('Descreva a movimentação.')).toBeInTheDocument()
  })
})

describe('financeiro é restrito', () => {
  it('sem a permissão, o item some do menu e a rota redireciona', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/financeiro')
    // cai na inicial em vez de abrir o caixa
    expect(await screen.findByText(/, Ada$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Financeiro' })).not.toBeInTheDocument()
  })

  it('admin continua vendo o financeiro', async () => {
    __login()
    renderAt('/financeiro')
    expect(await screen.findByRole('button', { name: '↑ Entrada' })).toBeInTheDocument()
  })
})

describe('atividade de extensão', () => {
  it('reúne frequência, entregas, chamadas e arquivos num lugar só', async () => {
    __login()
    renderAt('/extensao')
    expect(await screen.findByText('Frequência por integrante')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Entregas' }))
    expect(screen.getByText('Entregas do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Chamadas' }))
    expect(screen.getByText('Chamadas do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Arquivos' }))
    expect(screen.getByText('Arquivos do semestre')).toBeInTheDocument()
  })

  it('a chamada de um dia abre com quem esteve presente', async () => {
    __login()
    renderAt('/extensao')
    await userEvent.click(await screen.findByRole('button', { name: 'Chamadas' }))
    const linha = await screen.findByRole('button', { name: /07 jul/ })
    await userEvent.click(linha)
    expect(linha).toHaveAttribute('aria-expanded', 'true')
    // a ata do dia lista os nomes de quem esteve presente
    expect(screen.getAllByText(/Cândida Nunes/).length).toBeGreaterThan(1)
  })

  it('integrante não entra na área de extensão', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/extensao')
    expect(await screen.findByText(/, Ada$/)).toBeInTheDocument()
  })
})

describe('biblioteca editável', () => {
  it('receita manual abre para edição pelo menu', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByRole('button', { name: 'Ações de Capivara da Lú' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }))
    expect(await screen.findByRole('dialog', { name: 'Editar receita' })).toBeInTheDocument()
    expect(screen.getByLabelText(/NOME/)).toHaveValue('Capivara da Lú')
  })
})

describe('banco ainda sem a coluna turno', () => {
  /* `select('*')` devolve a linha sem a coluna enquanto a migration do turno não
     rodou. O app usa esse valor como chave de objeto, e sem normalizar na
     fronteira a página de Integrantes ficava em branco. */
  it('a página de integrantes abre mesmo assim', async () => {
    const antes = ADMIN_PROFILE.turno
    delete (ADMIN_PROFILE as unknown as Record<string, unknown>).turno
    try {
      __login()
      renderAt('/integrantes')
      expect(await screen.findByText('ENTREGAS NO SEMESTRE')).toBeInTheDocument()
      expect(screen.getByText(/FREQUÊNCIA ·/)).toBeInTheDocument()
    } finally {
      ADMIN_PROFILE.turno = antes
    }
  })
})
