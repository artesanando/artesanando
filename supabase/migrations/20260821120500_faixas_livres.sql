-- Manta de tricô: mexer nas faixas em qualquer posição, não só na última.
--
-- Até aqui o app só sabia somar uma faixa no fim e tirar a última. Quem
-- precisasse de uma faixa no meio da manta — porque a peça saiu curta, ou
-- porque a ordem das cores ficou errada — tinha que refazer o projeto.
--
-- `faixas` tem unique (projeto_id, ordem), então nenhuma dessas operações cabe
-- num UPDATE só: as ordens passam por valores negativos antes de assentar, que
-- é a mesma manobra do "limbo" que a troca de squares faz no front. Como é uma
-- transação por chamada, a manta nunca fica com duas faixas na mesma posição.

-- Renumera as faixas do projeto na ordem em que os ids chegam.
create or replace function public.reordenar_faixas(p_projeto uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras reordenam as faixas';
  end if;

  update public.faixas set ordem = -ordem where projeto_id = p_projeto;

  for i in 1 .. coalesce(array_length(p_ids, 1), 0) loop
    update public.faixas set ordem = i where id = p_ids[i] and projeto_id = p_projeto;
  end loop;

  -- sobrou negativa: id que não veio na lista. Vai para o fim, na ordem antiga.
  update public.faixas f
     set ordem = coalesce(array_length(p_ids, 1), 0) + r.pos
    from (
      select id, row_number() over (order by ordem desc) as pos
        from public.faixas
       where projeto_id = p_projeto and ordem < 0
    ) r
   where f.id = r.id;
end;
$$;

-- Insere uma faixa na posição pedida, empurrando as de baixo.
create or replace function public.inserir_faixa(p_projeto uuid, p_ordem int, p_cores jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nova uuid;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras criam faixas';
  end if;

  update public.faixas set ordem = -(ordem + 1)
   where projeto_id = p_projeto and ordem >= p_ordem;
  update public.faixas set ordem = -ordem
   where projeto_id = p_projeto and ordem < 0;

  insert into public.faixas (projeto_id, ordem, cores)
  values (p_projeto, p_ordem, coalesce(p_cores, '[]'::jsonb))
  returning id into nova;

  return nova;
end;
$$;

-- Remove uma faixa e fecha o buraco que ela deixa.
create or replace function public.remover_faixa(p_faixa uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  proj uuid;
  ord int;
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras removem faixas';
  end if;

  select projeto_id, ordem into proj, ord from public.faixas where id = p_faixa;
  if proj is null then
    return;
  end if;

  delete from public.faixas where id = p_faixa;

  update public.faixas set ordem = -(ordem - 1) where projeto_id = proj and ordem > ord;
  update public.faixas set ordem = -ordem where projeto_id = proj and ordem < 0;
end;
$$;
