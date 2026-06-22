# Artesanando

Aplicativo de gestão do projeto de extensão de crochê e tricô — mantas, amigurumis, materiais, encontros e caixa do projeto, tudo no mesmo lugar.

Implementado a partir do design **Artesanando App** (Claude Design).

## Funcionalidades

- **Login** — tela de entrada com usuário e senha.
- **Dashboard** — resumo do semestre: integrantes, estoque, projetos em produção e atividade recente.
- **Projetos** — mantas (crochê e tricô) e amigurumis por tipo, com progresso.
  - **Manta de crochê** — fluxo por etapa (miolo → aguardando borda → borda → pronto) e mapa de montagem interativo dos 80 granny squares.
  - **Manta de tricô** — prévia das faixas com editor de ordem de cores (reordenar / embaralhar).
  - **Amigurumi** — unidades por integrante, ficha e comentários.
- **Integrantes** — lista com frequência e painel de entregas do semestre.
- **Estoque** — novelos, agulhas, olhos & segurança, enchimento e itens de feira, com empréstimos ativos.
- **Biblioteca** — receitas e padrões com cards de detalhe (faixa, esquema de manta, granny).
- **Presença** — próximos encontros, histórico e chamada.
- **Financeiro** — saldo, entradas/saídas e movimentações.
- **Modais** — novo projeto (com criadores de padrão de granny, faixa de tricô e organizador de quadrados), movimentação financeira, material, receita, empréstimo, devolução, produção, integrante e encontro.
- **Configurações** — permissões das integrantes (apenas administradoras).

## Como rodar

É um app estático, sem build:

```
# abra index.html no navegador, ou sirva a pasta:
npx serve .
```

Também funciona direto no GitHub Pages.

## Estrutura

```
index.html    — casca da página
css/style.css — estilos compartilhados
js/app.js     — estado, dados e renderização (SPA em JS puro)
```
