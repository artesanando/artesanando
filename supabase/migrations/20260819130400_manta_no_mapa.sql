-- Manta de crochê: a produção passa a ser registrada direto no mapa.
--
-- O conceito de "lote" sai do app. Nenhuma tela jamais inseriu em `lotes` — o kanban
-- e o "Registrar produção" liam uma tabela que nunca recebia linha, por isso nenhum
-- square saía de 'afazer' e o progresso da manta era permanentemente 0. Quem faz o
-- quê passa a viver no próprio square.

alter table public.squares
  add column responsavel_id uuid references public.profiles (id) on delete set null;

create index squares_responsavel_idx on public.squares (responsavel_id) where etapa = 'pronto';

-- tamanho da manta deixa de ser fixo em 80 squares / 10 colunas
alter table public.projetos
  add column colunas int check (colunas > 0),
  add column linhas int check (linhas > 0);

alter table public.squares drop column lote_id;
drop table public.lotes; -- sempre esteve vazia: nada no app escreve nela

-- ---------- Criação transacional ----------

-- Antes, criar uma manta eram 3 chamadas soltas do front: se a inserção dos squares
-- falhasse, sobrava um projeto pela metade. Agora é uma transação só.
create or replace function public.criar_projeto_manta(
  p_nome text,
  p_destino text,
  p_emoji text,
  p_colunas int,
  p_linhas int,
  p_modelos jsonb, -- [{letra, nome, cor_borda, cor_miolo}, ...]
  p_celulas jsonb  -- [["A","B",...], ...] com p_linhas × p_colunas letras
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  projeto_id uuid;
  semestre uuid;
  autor uuid := public.meu_perfil_id();
  modelo jsonb;
  por_letra jsonb := '{}'::jsonb;
  novo_id uuid;
  r int;
  c int;
  letra text;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras criam projetos';
  end if;

  select id into semestre from public.semestres where ativo limit 1;

  insert into public.projetos (semestre_id, nome, tipo, destino, emoji, colunas, linhas, created_by)
  values (semestre, p_nome, 'manta_croche', p_destino, p_emoji, p_colunas, p_linhas, autor)
  returning id into projeto_id;

  for modelo in select * from jsonb_array_elements(p_modelos) loop
    insert into public.manta_modelos (projeto_id, letra, nome, cor_borda, cor_miolo, total)
    values (
      projeto_id,
      modelo ->> 'letra',
      modelo ->> 'nome',
      modelo ->> 'cor_borda',
      modelo ->> 'cor_miolo',
      0
    )
    returning id into novo_id;
    por_letra := por_letra || jsonb_build_object(modelo ->> 'letra', novo_id);
  end loop;

  for r in 0 .. p_linhas - 1 loop
    for c in 0 .. p_colunas - 1 loop
      letra := p_celulas -> r ->> c;
      insert into public.squares (projeto_id, modelo_id, posicao, etapa)
      values (
        projeto_id,
        (por_letra ->> coalesce(letra, p_modelos -> 0 ->> 'letra'))::uuid,
        r * p_colunas + c,
        'afazer'
      );
    end loop;
  end loop;

  update public.manta_modelos m
     set total = (select count(*) from public.squares s where s.modelo_id = m.id)
   where m.projeto_id = projeto_id;

  insert into public.atividades (autor_id, tipo, projeto_id, payload)
  values (autor, 'projeto', projeto_id, jsonb_build_object('texto', 'criou o projeto ' || p_nome));

  return projeto_id;
end;
$$;

-- ---------- Redimensionar ----------

-- Quantos squares JÁ FEITOS somem se a manta encolher para colunas × linhas.
create or replace function public.squares_perdidos(p_projeto uuid, p_colunas int, p_linhas int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with atual as (select colunas as cols from public.projetos where id = p_projeto)
  select count(*)::int
    from public.squares s, atual a
   where s.projeto_id = p_projeto
     and s.etapa <> 'afazer'
     and (s.posicao / a.cols >= p_linhas or s.posicao % a.cols >= p_colunas);
$$;

create or replace function public.redimensionar_manta(p_projeto uuid, p_colunas int, p_linhas int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cols_atual int;
  modelo_padrao uuid;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras mudam o tamanho da manta';
  end if;

  select colunas into cols_atual from public.projetos where id = p_projeto;
  select id into modelo_padrao from public.manta_modelos where projeto_id = p_projeto order by letra limit 1;

  if cols_atual is null or modelo_padrao is null then
    raise exception 'manta sem grade ou sem modelos definidos';
  end if;

  -- 1. o que cai fora da nova grade sai
  delete from public.squares
   where projeto_id = p_projeto
     and (posicao / cols_atual >= p_linhas or posicao % cols_atual >= p_colunas);

  -- 2. remapeia (linha, coluna) para o novo número de colunas. Em duas passadas com
  --    um deslocamento grande, senão as posições novas colidem com as antigas no
  --    unique (projeto_id, posicao) no meio do UPDATE.
  update public.squares
     set posicao = 1000000 + (posicao / cols_atual) * p_colunas + (posicao % cols_atual)
   where projeto_id = p_projeto;

  update public.squares
     set posicao = posicao - 1000000
   where projeto_id = p_projeto;

  -- 3. preenche os buracos que a grade nova abriu
  insert into public.squares (projeto_id, modelo_id, posicao, etapa)
  select p_projeto, modelo_padrao, g, 'afazer'
    from generate_series(0, p_colunas * p_linhas - 1) g
  on conflict (projeto_id, posicao) do nothing;

  update public.projetos set colunas = p_colunas, linhas = p_linhas where id = p_projeto;

  update public.manta_modelos m
     set total = (select count(*) from public.squares s where s.modelo_id = m.id)
   where m.projeto_id = p_projeto;
end;
$$;

-- ---------- pode_excluir passa a olhar squares também ----------

create or replace function public.pode_excluir(tabela text, alvo uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  case tabela
    when 'projetos' then
      return not exists (select 1 from public.squares where projeto_id = alvo and etapa <> 'afazer')
         and not exists (select 1 from public.faixas where projeto_id = alvo and status <> 'afazer')
         and not exists (select 1 from public.unidades where projeto_id = alvo)
         and not exists (select 1 from public.comentarios where projeto_id = alvo);

    when 'encontros' then
      return not exists (select 1 from public.presencas where encontro_id = alvo);

    when 'receitas' then
      return not exists (select 1 from public.projetos where receita_id = alvo);

    when 'estoque_itens' then
      return not exists (select 1 from public.emprestimos where item_id = alvo)
         and not exists (select 1 from public.estoque_movimentos where item_id = alvo);

    when 'movimentacoes' then
      return true;

    when 'profiles' then
      return alvo is distinct from public.meu_perfil_id()
         and not exists (select 1 from public.presencas where integrante_id = alvo)
         and not exists (select 1 from public.unidades where responsavel_id = alvo)
         and not exists (select 1 from public.faixas where responsavel_id = alvo)
         and not exists (select 1 from public.squares where responsavel_id = alvo)
         and not exists (select 1 from public.comentarios where autor_id = alvo)
         and not exists (select 1 from public.emprestimos where integrante_id = alvo)
         and not exists (select 1 from public.atividades where autor_id = alvo);

    else
      return false;
  end case;
end;
$$;
