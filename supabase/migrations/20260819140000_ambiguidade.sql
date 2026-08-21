-- Duas funções quebravam em uso por nome ambíguo: o parâmetro (ou a variável)
-- tinha o mesmo nome de uma coluna da tabela que a própria função mexia, e o
-- plpgsql não sabia a qual dos dois a referência se referia.
--
--   vincular_perfil(origem, destino) → 42702 'column reference "origem" is ambiguous'
--     `origem`  colide com receitas.origem
--     `destino` colide com projetos.destino
--
--   criar_projeto_manta(...)         → 42702 'column reference "projeto_id" is ambiguous'
--     a variável `projeto_id` colide com manta_modelos/squares/atividades.projeto_id
--
-- Agora todo nome interno leva prefixo. Trocar nome de PARÂMETRO exige recriar a
-- função (create or replace não renomeia), por isso o drop no vincular_perfil.

begin;

-- ---------- vincular_perfil ----------

drop function if exists public.vincular_perfil(uuid, uuid);

create function public.vincular_perfil(p_origem uuid, p_destino uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras vinculam perfis';
  end if;

  if p_origem = p_destino then
    raise exception 'origem e destino são o mesmo perfil';
  end if;

  if not exists (select 1 from public.profiles where id = p_destino) then
    raise exception 'perfil de destino não existe';
  end if;

  if exists (select 1 from public.profiles where id = p_origem and user_id is not null) then
    raise exception 'o perfil de origem tem conta própria — desative-o em vez de vincular';
  end if;

  -- presenças: a PK é (encontro, integrante), então some as duplicatas antes de mover
  delete from public.presencas o
   where o.integrante_id = p_origem
     and exists (
       select 1 from public.presencas d
        where d.encontro_id = o.encontro_id and d.integrante_id = p_destino
     );
  update public.presencas set integrante_id = p_destino where integrante_id = p_origem;
  update public.presencas set marcado_por = p_destino where marcado_por = p_origem;

  update public.unidades set responsavel_id = p_destino where responsavel_id = p_origem;
  update public.faixas set responsavel_id = p_destino where responsavel_id = p_origem;
  update public.squares set responsavel_id = p_destino where responsavel_id = p_origem;
  update public.manta_modelos set responsavel_id = p_destino where responsavel_id = p_origem;
  update public.comentarios set autor_id = p_destino where autor_id = p_origem;
  update public.atividades set autor_id = p_destino where autor_id = p_origem;
  update public.emprestimos set integrante_id = p_destino where integrante_id = p_origem;
  update public.movimentacoes set criado_por = p_destino where criado_por = p_origem;
  update public.receitas set criado_por = p_destino where criado_por = p_origem;
  update public.projetos set created_by = p_destino where created_by = p_origem;
  update public.estoque_movimentos set criado_por = p_destino where criado_por = p_origem;

  delete from public.permissoes where profile_id = p_origem;
  delete from public.profiles where id = p_origem;
end;
$$;

-- ---------- criar_projeto_manta ----------

-- Os parâmetros já eram p_*; o que colidia eram as variáveis declaradas. De
-- quebra, o update final comparava `m.projeto_id = projeto_id` — a coluna com
-- ela mesma, sempre verdadeiro — e recontava o total de TODOS os projetos.
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
  v_projeto uuid;
  v_semestre uuid;
  v_autor uuid := public.meu_perfil_id();
  v_modelo jsonb;
  v_por_letra jsonb := '{}'::jsonb;
  v_novo_id uuid;
  v_r int;
  v_c int;
  v_letra text;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras criam projetos';
  end if;

  select s.id into v_semestre from public.semestres s where s.ativo limit 1;

  insert into public.projetos (semestre_id, nome, tipo, destino, emoji, colunas, linhas, created_by)
  values (v_semestre, p_nome, 'manta_croche', p_destino, p_emoji, p_colunas, p_linhas, v_autor)
  returning id into v_projeto;

  for v_modelo in select * from jsonb_array_elements(p_modelos) loop
    insert into public.manta_modelos (projeto_id, letra, nome, cor_borda, cor_miolo, total)
    values (
      v_projeto,
      v_modelo ->> 'letra',
      v_modelo ->> 'nome',
      v_modelo ->> 'cor_borda',
      v_modelo ->> 'cor_miolo',
      0
    )
    returning id into v_novo_id;
    v_por_letra := v_por_letra || jsonb_build_object(v_modelo ->> 'letra', v_novo_id);
  end loop;

  for v_r in 0 .. p_linhas - 1 loop
    for v_c in 0 .. p_colunas - 1 loop
      v_letra := p_celulas -> v_r ->> v_c;
      insert into public.squares (projeto_id, modelo_id, posicao, etapa)
      values (
        v_projeto,
        (v_por_letra ->> coalesce(v_letra, p_modelos -> 0 ->> 'letra'))::uuid,
        v_r * p_colunas + v_c,
        'afazer'
      );
    end loop;
  end loop;

  update public.manta_modelos m
     set total = (select count(*) from public.squares s where s.modelo_id = m.id)
   where m.projeto_id = v_projeto;

  insert into public.atividades (autor_id, tipo, projeto_id, payload)
  values (v_autor, 'projeto', v_projeto, jsonb_build_object('texto', 'criou o projeto ' || p_nome));

  return v_projeto;
end;
$$;

-- ---------- redimensionar_manta ----------

-- Mesma família de problema: `cols_atual` e `modelo_padrao` não colidem, mas os
-- selects sem alias liam a coluna do próprio update. Prefixando por consistência,
-- e corrigindo o recount final, que tinha o mesmo bug do `projeto_id`.
create or replace function public.redimensionar_manta(p_projeto uuid, p_colunas int, p_linhas int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cols_atual int;
  v_modelo_padrao uuid;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras mudam o tamanho da manta';
  end if;

  select p.colunas into v_cols_atual from public.projetos p where p.id = p_projeto;
  select m.id into v_modelo_padrao
    from public.manta_modelos m where m.projeto_id = p_projeto order by m.letra limit 1;

  if v_cols_atual is null or v_modelo_padrao is null then
    raise exception 'manta sem grade ou sem modelos definidos';
  end if;

  -- 1. o que cai fora da nova grade sai
  delete from public.squares
   where projeto_id = p_projeto
     and (posicao / v_cols_atual >= p_linhas or posicao % v_cols_atual >= p_colunas);

  -- 2. remapeia (linha, coluna) para o novo número de colunas. Em duas passadas
  --    com um deslocamento grande, senão as posições novas colidem com as antigas
  --    no unique (projeto_id, posicao) no meio do UPDATE.
  update public.squares
     set posicao = 1000000 + (posicao / v_cols_atual) * p_colunas + (posicao % v_cols_atual)
   where projeto_id = p_projeto;

  update public.squares
     set posicao = posicao - 1000000
   where projeto_id = p_projeto;

  -- 3. preenche os buracos que a grade nova abriu
  insert into public.squares (projeto_id, modelo_id, posicao, etapa)
  select p_projeto, v_modelo_padrao, g, 'afazer'
    from generate_series(0, p_colunas * p_linhas - 1) g
  on conflict (projeto_id, posicao) do nothing;

  update public.projetos set colunas = p_colunas, linhas = p_linhas where id = p_projeto;

  update public.manta_modelos m
     set total = (select count(*) from public.squares s where s.modelo_id = m.id)
   where m.projeto_id = p_projeto;
end;
$$;

commit;
