-- Junta duas fichas da mesma pessoa: a de "só chamada" (origem, sem conta) some e
-- tudo que estava pendurado nela passa para a ficha definitiva (destino).
--
-- Existe porque a mesma integrante pode ter sido anotada na chamada antes de ganhar
-- acesso ao app, e depois convidada por um usuário diferente — nesse caso o trigger
-- handle_new_user não consegue ligar sozinho e a admin resolve aqui.

create or replace function public.vincular_perfil(origem uuid, destino uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'apenas administradoras vinculam perfis';
  end if;

  if origem = destino then
    raise exception 'origem e destino são o mesmo perfil';
  end if;

  if not exists (select 1 from public.profiles where id = destino) then
    raise exception 'perfil de destino não existe';
  end if;

  if exists (select 1 from public.profiles where id = origem and user_id is not null) then
    raise exception 'o perfil de origem tem conta própria — desative-o em vez de vincular';
  end if;

  -- presenças: a PK é (encontro, integrante), então some as duplicatas antes de mover
  delete from public.presencas o
   where o.integrante_id = origem
     and exists (
       select 1 from public.presencas d
        where d.encontro_id = o.encontro_id and d.integrante_id = destino
     );
  update public.presencas set integrante_id = destino where integrante_id = origem;
  update public.presencas set marcado_por = destino where marcado_por = origem;

  update public.unidades set responsavel_id = destino where responsavel_id = origem;
  update public.faixas set responsavel_id = destino where responsavel_id = origem;
  update public.squares set responsavel_id = destino where responsavel_id = origem;
  update public.manta_modelos set responsavel_id = destino where responsavel_id = origem;
  update public.comentarios set autor_id = destino where autor_id = origem;
  update public.atividades set autor_id = destino where autor_id = origem;
  update public.emprestimos set integrante_id = destino where integrante_id = origem;
  update public.movimentacoes set criado_por = destino where criado_por = origem;
  update public.receitas set criado_por = destino where criado_por = origem;
  update public.projetos set created_by = destino where created_by = origem;
  update public.estoque_movimentos set criado_por = destino where criado_por = origem;

  delete from public.permissoes where profile_id = origem;
  delete from public.profiles where id = origem;
end;
$$;
