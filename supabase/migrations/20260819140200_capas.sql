-- Foto de capa na biblioteca e no estoque, e receita em vídeo.
--
-- Sem capa, o card fica identificado só pela cor da categoria — e é o que
-- continua acontecendo quando `capa_path` é nulo. O vídeo entra como link
-- (YouTube e afins): o arquivo em si ficaria caro de guardar e de servir.

alter table public.receitas
  add column capa_path text,
  add column video_url text;

alter table public.estoque_itens
  add column capa_path text;

-- ---------- Bucket ----------

insert into storage.buckets (id, name, public)
values ('capas', 'capas', false)
on conflict (id) do nothing;

create policy capas_read on storage.objects
  for select to authenticated using (bucket_id = 'capas');

create policy capas_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'capas');

create policy capas_update on storage.objects
  for update to authenticated using (bucket_id = 'capas');

create policy capas_delete on storage.objects
  for delete to authenticated using (bucket_id = 'capas' and public.is_admin());
