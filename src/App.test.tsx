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

  it('a manta nasce de um esquema salvo, e nunca do zero', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    expect(screen.getByLabelText('Esquema de manta')).toBeInTheDocument()
    // montar cores e tamanho aqui dentro deixava de existir
    expect(screen.queryByLabelText('Colunas')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nome do modelo A')).not.toBeInTheDocument()
  })

  it('o tamanho da peça vem sempre do esquema escolhido', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esquema de manta' }))
    await userEvent.click(await screen.findByRole('option', { name: /Esquema Xadrez/ }))
    expect(screen.getByLabelText('LARGURA DO SQUARE (CM)')).toHaveValue('20')

    // trocar de esquema reescreve a medida: antes ficava a do anterior
    await userEvent.click(screen.getByRole('button', { name: 'Tricô' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esquema de manta' }))
    await userEvent.click(await screen.findByRole('option', { name: /Esquema Listrado/ }))
    expect(screen.getByLabelText('LARGURA DA FAIXA (CM)')).toHaveValue('100')
    expect(screen.getByLabelText('ALTURA DA FAIXA (CM)')).toHaveValue('12')
  })

  it('sem esquema salvo, o próprio formulário leva ao criador', async () => {
    __login()
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo projeto' }))
    await userEvent.click(screen.getByRole('button', { name: '+ Criar esquema' }))
    // o editor só abre depois de dizer a técnica
    expect(screen.getByText('DE QUE TÉCNICA É A MANTA?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Crochê' }))
    expect(screen.getByLabelText('Nome do esquema')).toBeInTheDocument()
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
    await userEvent.click(await screen.findByRole('button', { name: 'Concluir' }))
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

  it('admin mexe na estrutura da manta de tricô', async () => {
    __login()
    renderAt('/projetos/p2')
    await userEvent.click(await screen.findByRole('button', { name: /Faixa 2, a fazer/ }))
    expect(screen.getByRole('button', { name: /Mover a faixa 2 para cima/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Inserir abaixo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Remover' })).toBeEnabled()
  })

  it('integrante não mexe na estrutura da manta de tricô', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/projetos/p2')
    await screen.findByText('FEITA · SOMENTE LEITURA')
    expect(screen.queryByRole('button', { name: 'Inserir abaixo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Faixa no fim' })).not.toBeInTheDocument()
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
  it('sem dia escolhido, o calendário aparece e a chamada não', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText('Próximos encontros')).toBeInTheDocument()
    expect(await screen.findByText('Escolha um dia no calendário.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Marcar presença de Cândida Nunes')).not.toBeInTheDocument()
  })

  it('a chamada abre no encontro do dia escolhido', async () => {
    __login()
    renderAt('/presenca/en1')
    expect(await screen.findByLabelText('Marcar presença de Cândida Nunes')).toBeInTheDocument()
    // o pé diz quem preencheu — é o que a auditoria mostra em detalhe
    expect(screen.getByText(/Preenchida por/)).toBeInTheDocument()
  })

  it('o encontro futuro traz o turno junto da data', async () => {
    __login()
    renderAt('/presenca')
    expect(await screen.findByText(/Noturno/)).toBeInTheDocument()
  })

  it('dá para editar e cancelar um encontro, e arquivar deixou de existir', async () => {
    __login()
    renderAt('/presenca/en1')
    await userEvent.click(await screen.findByRole('button', { name: /Ações do encontro de 07 jul/ }))
    expect(screen.getByRole('menuitem', { name: 'Editar encontro' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Cancelar encontro' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Arquivar' })).not.toBeInTheDocument()
  })

  it('sem a permissão de presença, vê a chamada mas não marca', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/presenca/en1')
    expect(await screen.findByLabelText('Marcar presença de Cândida Nunes')).toBeDisabled()
    expect(screen.queryByRole('button', { name: '+ Novo encontro' })).not.toBeInTheDocument()
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
    renderAt('/presenca/en1')
    expect(await screen.findByText('Hedy Lamarr')).toBeInTheDocument()
    expect(screen.getByText('SEM PERFIL')).toBeInTheDocument()
  })

  it('admin pode anotar alguém que ainda não tem perfil', async () => {
    __login()
    renderAt('/presenca/en1')
    expect(
      await screen.findByRole('button', { name: '+ Alguém que ainda não tem perfil' }),
    ).toBeInTheDocument()
  })
})

describe('mural', () => {
  it('qualquer integrante vê o mural e os álbuns', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/mural')
    // "Mural" aparece no menu e no título — a caixa de subir prova que a página abriu
    expect(
      await screen.findByRole('button', { name: /clique para escolher/ }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /^Feira de junho/ })).toBeInTheDocument()
  })

  it('criar álbum é um campo na lateral, não a janela do navegador', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/mural')
    await userEvent.click(await screen.findByRole('button', { name: '+ Novo álbum' }))
    expect(screen.getByLabelText('Nome do álbum')).toBeInTheDocument()
  })

  it('a lateral conta as fotos de cada álbum', async () => {
    __login()
    renderAt('/mural')
    // duas fotos ao todo, uma delas fora de álbum
    expect(await screen.findByText(/2 fotos · 1 fora de álbum/)).toBeInTheDocument()
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
    // o turno vira um seletor: a barra mostra um recorte por vez, não os três
    expect(screen.getByLabelText('Turno da frequência')).toBeInTheDocument()
  })

  it('as entregas passam a contar granny squares', async () => {
    __login()
    renderAt('/integrantes')
    expect(await screen.findByText('Granny squares prontos')).toBeInTheDocument()
  })

  it('avisa quem ainda precisa ser vinculada a um perfil', async () => {
    __login()
    renderAt('/integrantes')
    // o aviso nasce recolhido: fica o lembrete, e a lista abre no clique
    const aviso = await screen.findByRole('button', { name: /1 pessoa na chamada.*sem perfil/ })
    expect(aviso).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Juntar a outra' })).not.toBeInTheDocument()
    await userEvent.click(aviso)
    expect(screen.getByRole('button', { name: 'Juntar a outra' })).toBeInTheDocument()
  })
})

describe('configurações', () => {
  it('sobraram Permissões e Semestre — encontros são assunto da Presença', async () => {
    __login()
    renderAt('/configuracoes')
    await userEvent.click(await screen.findByRole('button', { name: 'Semestre' }))
    expect(screen.getByText('Semestre do projeto')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Encontros' })).not.toBeInTheDocument()
  })

  it('a tabela ordena ao clicar no cabeçalho', async () => {
    __login()
    renderAt('/configuracoes')
    const cab = await screen.findByRole('columnheader', { name: /INTEGRANTE/ })
    expect(cab).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(screen.getByRole('button', { name: 'INTEGRANTE' }))
    expect(cab).toHaveAttribute('aria-sort', 'descending')
  })

  it('a permissão de presença entra na tabela, e a de moderação sai', async () => {
    __login()
    renderAt('/configuracoes')
    expect(
      await screen.findByRole('switch', { name: 'PRESENÇA de Ada Lovelace' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('MODERAÇÃO')).not.toBeInTheDocument()
  })

  it('dá para tornar alguém administradora pela tabela', async () => {
    __login()
    renderAt('/configuracoes')
    const chave = await screen.findByRole('switch', { name: 'ADMINISTRADORA de Ada Lovelace' })
    expect(chave).not.toBeChecked()
    // a própria admin logada não se rebaixa por descuido
    expect(screen.getByRole('switch', { name: 'ADMINISTRADORA de Cândida Nunes' })).toBeDisabled()
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

  it('o detalhe da receita aceita comentário, mesmo sem permissão nenhuma', async () => {
    __login(INTEGRANTE_PROFILE)
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByText('Granny Flor de Maio'))
    expect(await screen.findByLabelText('Escrever um comentário')).toBeInTheDocument()
    expect(screen.getByLabelText('Anexar foto ao comentário')).toBeInTheDocument()
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

  it('o esquema de tricô puxa cores, faixas e medida do padrão salvo', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esquema de manta' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Tricô' }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Puxar padrão de faixa da biblioteca' }),
    )
    await userEvent.click(await screen.findByRole('option', { name: /Listras do Ateliê/ }))
    // antes daqui saíam só as cores: a manta nascia com 8 faixas e sem medida
    expect(screen.getByRole('spinbutton', { name: 'Faixas' })).toHaveAttribute(
      'aria-valuenow',
      '10',
    )
    expect(screen.getByLabelText('LARGURA DA FAIXA (CM)')).toHaveValue('90')
    expect(screen.getByLabelText('ALTURA DA FAIXA (CM)')).toHaveValue('10')
  })

  it('a categoria troca o editor sem sair do fluxo', async () => {
    __login()
    renderAt('/biblioteca')
    await userEvent.click(await screen.findByRole('button', { name: '+ Adicionar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esquema de manta' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Tricô' }))
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
    await userEvent.click(await screen.findByRole('button', { name: 'Entrada' }))
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
    expect(await screen.findByRole('button', { name: 'Entrada' })).toBeInTheDocument()
  })
})

describe('atividade de extensão', () => {
  it('reúne créditos, frequência, entregas, chamadas, arquivos e auditoria', async () => {
    __login()
    renderAt('/extensao')
    // créditos abre primeiro: é o que trava a validação do projeto de extensão
    expect(await screen.findByText('Regras do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Frequência' }))
    expect(screen.getByText('Frequência por integrante')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Entregas' }))
    expect(screen.getByText('Entregas do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Chamadas' }))
    expect(screen.getByText('Chamadas do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Arquivos' }))
    expect(screen.getByText('Arquivos do semestre')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Auditoria' }))
    expect(screen.getByLabelText('Ação')).toBeInTheDocument()
  })

  it('o RA aparece ao lado do nome nas guias, e quem não tem mostra travessão', async () => {
    __login()
    renderAt('/extensao')
    await userEvent.click(await screen.findByRole('button', { name: 'Frequência' }))
    // a Cândida preencheu; a Ada ainda não
    expect(await screen.findByText(/100100 ·/)).toBeInTheDocument()
    expect(screen.getByText(/— ·/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entregas' }))
    expect(await screen.findByText('100100')).toBeInTheDocument()
  })

  it('a regra do semestre se monta por blocos de alternativas', async () => {
    __login()
    renderAt('/extensao')
    await screen.findByText('Regras do semestre')
    // dois níveis, cada um com o seu botão de novo bloco
    expect(screen.getAllByRole('button', { name: '+ Bloco' })).toHaveLength(2)
    expect(screen.getByText('INICIANTE')).toBeInTheDocument()
    expect(screen.getByText('EXPERIENTE')).toBeInTheDocument()
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

  it('a frequência tem busca por nome e explica as colunas', async () => {
    __login()
    renderAt('/extensao')
    await userEvent.click(await screen.findByRole('button', { name: 'Frequência' }))
    expect(screen.getByLabelText('Buscar integrante')).toBeInTheDocument()
    // o total não é a soma dos turnos, e a entrega virou fracionária
    expect(screen.getByRole('button', { name: /não é a soma de diurno e noturno/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /o miolo vale 0,5 e a borda 0,5/ })).toBeInTheDocument()
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

describe('banco ainda sem as colunas novas', () => {
  /* `select('*')` devolve a linha sem a coluna enquanto a migration não rodou.
     O app usa esses valores como chave de objeto, e sem normalizar na fronteira
     a página de Integrantes ficava em branco. Vale para turno e para nível. */
  it('a página de integrantes abre mesmo assim', async () => {
    const perfil = ADMIN_PROFILE as unknown as Record<string, unknown>
    const antes = { turno: perfil.turno, nivel: perfil.nivel }
    delete perfil.turno
    delete perfil.nivel
    try {
      __login()
      renderAt('/integrantes')
      expect(await screen.findByText('ENTREGAS NO SEMESTRE')).toBeInTheDocument()
      expect(screen.getByText('FREQUÊNCIA')).toBeInTheDocument()
    } finally {
      Object.assign(perfil, antes)
    }
  })
})
