-- Tamanho esperado das peças, em centímetros.
--
-- A medida mora no padrão da biblioteca (um granny de 12×12 é sempre 12×12) e o
-- projeto herda dela na criação, podendo ajustar só para si — a mesma receita
-- rende tamanhos diferentes conforme o fio e a mão de quem faz.
--
-- O tamanho da manta não é coluna: sai da conta grade × peça, e guardá-lo
-- separado só criaria dois números para a mesma verdade.

alter table public.receitas
  add column largura_cm numeric(6, 1) check (largura_cm > 0),
  add column altura_cm numeric(6, 1) check (altura_cm > 0);

alter table public.projetos
  add column peca_largura_cm numeric(6, 1) check (peca_largura_cm > 0),
  add column peca_altura_cm numeric(6, 1) check (peca_altura_cm > 0);

-- ---------- A criação da manta passa a gravar a medida junto ----------

-- Dois parâmetros novos. Recriada em vez de `create or replace` para não deixar
-- duas versões conviverem: com sobrecarga, uma chamada por nome de argumento
-- fica ambígua e o PostgREST recusa.
drop function if exists public.criar_projeto_manta(text, text, text, int, int, jsonb, jsonb);

create function public.criar_projeto_manta(
  p_nome text,
  p_destino text,
  p_emoji text,
  p_colunas int,
  p_linhas int,
  p_modelos jsonb, -- [{letra, nome, cor_borda, cor_miolo}, ...]
  p_celulas jsonb, -- [["A","B",...], ...] com p_linhas × p_colunas letras
  p_peca_largura_cm numeric default null,
  p_peca_altura_cm numeric default null
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

  insert into public.projetos (
    semestre_id, nome, tipo, destino, emoji, colunas, linhas,
    peca_largura_cm, peca_altura_cm, created_by
  )
  values (
    v_semestre, p_nome, 'manta_croche', p_destino, p_emoji, p_colunas, p_linhas,
    p_peca_largura_cm, p_peca_altura_cm, v_autor
  )
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
