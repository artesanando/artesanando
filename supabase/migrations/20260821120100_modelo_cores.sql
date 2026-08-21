-- O modelo de granny passa a guardar todas as carreiras.
--
-- `cor_borda`/`cor_miolo` reduziam qualquer padrão a duas cores: um granny de
-- quatro carreiras perdia as duas do meio ao virar modelo do esquema. As duas
-- colunas antigas são `not null` e continuam sendo o fallback de tudo que foi
-- criado antes — `cores` é o array do miolo para fora, quando existir.

alter table public.manta_modelos add column cores jsonb;

-- Recriada (e não `create or replace`) porque a assinatura muda: com sobrecarga,
-- chamada por nome de argumento fica ambígua e o PostgREST recusa.
drop function if exists public.criar_projeto_manta(text, text, text, int, int, jsonb, jsonb, numeric, numeric);

create function public.criar_projeto_manta(
  p_nome text,
  p_destino text,
  p_emoji text,
  p_colunas int,
  p_linhas int,
  p_modelos jsonb, -- [{letra, nome, cor_borda, cor_miolo, cores?}, ...]
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
    insert into public.manta_modelos (projeto_id, letra, nome, cor_borda, cor_miolo, cores, total)
    values (
      v_projeto,
      v_modelo ->> 'letra',
      v_modelo ->> 'nome',
      v_modelo ->> 'cor_borda',
      v_modelo ->> 'cor_miolo',
      v_modelo -> 'cores',
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
