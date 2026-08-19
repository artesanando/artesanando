-- Bucket das fotos de perfil.
-- Convenção do caminho: '<perfil_id>/<uuid>.jpg' — a pasta é o id do perfil, e é
-- isso que a policy usa para deixar cada uma mexer só na própria foto.

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', false)
on conflict (id) do nothing;

create policy avatares_read on storage.objects
  for select to authenticated using (bucket_id = 'avatares');

create policy avatares_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (
      (storage.foldername(name))[1] = public.meu_perfil_id()::text
      or public.is_admin()
    )
  );

create policy avatares_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and (
      (storage.foldername(name))[1] = public.meu_perfil_id()::text
      or public.is_admin()
    )
  );

create policy avatares_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatares'
    and (
      (storage.foldername(name))[1] = public.meu_perfil_id()::text
      or public.is_admin()
    )
  );
