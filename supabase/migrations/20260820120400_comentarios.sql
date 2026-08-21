-- Comentário com foto, e comentário na biblioteca.
--
-- A tabela era exclusiva de projeto. Passa a apontar para um projeto OU uma
-- receita, nunca os dois e nunca nenhum — o CHECK garante isso, de modo que
-- não existe linha órfã nem linha ambígua.

alter table public.comentarios
  alter column projeto_id drop not null,
  add column receita_id uuid references public.receitas (id) on delete cascade,
  add column foto_path text;

alter table public.comentarios add constraint comentarios_alvo_check
  check ((projeto_id is null) <> (receita_id is null));

create index comentarios_receita_idx on public.comentarios (receita_id, created_at);

-- ---------- Storage ----------

insert into storage.buckets (id, name, public)
values ('comentarios', 'comentarios', false)
on conflict (id) do nothing;

create policy comentarios_storage_read on storage.objects
  for select to authenticated using (bucket_id = 'comentarios');

create policy comentarios_storage_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'comentarios');

create policy comentarios_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'comentarios' and (public.is_admin() or public.has_perm('comentarios')));
