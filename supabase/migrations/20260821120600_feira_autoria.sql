-- Peça de feira também é entrega.
--
-- Um amigurumi que a integrante fez e pôs à venda na feira é trabalho dela do
-- mesmo jeito que um amigurumi de projeto — e não aparecia em lugar nenhum do
-- relatório de extensão. Faltava só saber de quem é a peça: `estoque_itens`
-- guardava o que existe, nunca quem fez.
--
-- `on delete set null` e não cascade: desativar uma integrante não pode apagar
-- o que está à venda na feira.

alter table public.estoque_itens
  add column autoria_id uuid references public.profiles (id) on delete set null;

comment on column public.estoque_itens.autoria_id is
  'Quem fez a peça — só faz sentido em item de feira; conta como entrega dela.';

-- Entrega é sempre de um semestre. A peça de projeto herda o semestre do
-- projeto; a de feira não tem de quem herdar, então carrega o seu — carimbado
-- no cadastro, como "o semestre em que ela entrou".
alter table public.estoque_itens
  add column semestre_id uuid references public.semestres (id) on delete set null;

-- a tela de Entregas varre os itens de feira por autora e por semestre
create index estoque_itens_autoria_idx on public.estoque_itens (autoria_id)
  where autoria_id is not null;

-- A peça de feira entra nas regras de crédito como um tipo próprio: um
-- amigurumi de feira não fecha a exigência "3 amigurumis" do projeto, mas a
-- coordenação pode exigir "2 peças de feira" separadamente.
alter table public.credito_linhas drop constraint credito_linhas_tipo_check;
alter table public.credito_linhas add constraint credito_linhas_tipo_check
  check (tipo in ('amigurumi', 'granny', 'faixa', 'frequencia', 'mentoria', 'feira'));
