-- A chave de moderação sai: administradora tem, e pronto.
--
-- Ela nasceu quando comentar deixou de pedir permissão, para dar a alguém o
-- poder de apagar comentário alheio. Na prática é decisão de coordenação, e uma
-- chave a mais na tabela só atrapalhava a leitura dela.

drop policy comentarios_delete on public.comentarios;
create policy comentarios_delete on public.comentarios
  for delete to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin());

drop policy comentarios_storage_delete on storage.objects;
create policy comentarios_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'comentarios' and public.is_admin());

alter table public.permissoes drop column comentarios;

create or replace function public.has_perm(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or coalesce((
    select case perm
      when 'progresso' then pm.progresso
      when 'devolucoes' then pm.devolucoes
      when 'financeiro' then pm.financeiro
      when 'presenca' then pm.presenca
      else false
    end
    from public.permissoes pm
    where pm.profile_id = public.meu_perfil_id()
  ), false);
$$;
