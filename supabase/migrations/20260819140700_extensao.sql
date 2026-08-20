-- Comprovação da atividade de extensão.
--
-- A coordenação precisa prestar contas do semestre: quem veio, quem entregou o
-- quê, e as fotos das doações. Isso não é configuração do app — é o produto do
-- trabalho — e por isso ganha lugar próprio em vez de virar mais uma aba de
-- Ajustes. Tudo restrito a administradoras.

create table public.arquivos_extensao (
  id uuid primary key default gen_random_uuid(),
  semestre_id uuid references public.semestres (id) on delete set null,
  titulo text not null,
  tipo text not null check (tipo in ('foto', 'documento')),
  path text not null,
  data date not null default current_date,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index arquivos_extensao_semestre_idx
  on public.arquivos_extensao (semestre_id, data desc);

alter table public.arquivos_extensao enable row level security;

create policy arquivos_extensao_select on public.arquivos_extensao
  for select to authenticated using (public.is_admin());
create policy arquivos_extensao_write on public.arquivos_extensao
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Bucket ----------

insert into storage.buckets (id, name, public)
values ('extensao', 'extensao', false)
on conflict (id) do nothing;

create policy extensao_read on storage.objects
  for select to authenticated using (bucket_id = 'extensao' and public.is_admin());
create policy extensao_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'extensao' and public.is_admin());
create policy extensao_delete on storage.objects
  for delete to authenticated using (bucket_id = 'extensao' and public.is_admin());
