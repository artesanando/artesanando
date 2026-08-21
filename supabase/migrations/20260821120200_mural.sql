-- Mural: as fotos do grupo, com álbuns de nome livre.
--
-- Separado de `arquivos_extensao`, que é comprovação para a coordenação e por
-- isso só administradora lê. O mural é do grupo: todas veem, sobem e organizam.

create table public.mural_albuns (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.mural_fotos (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  -- `set null` é o que faz apagar um álbum devolver as fotos para as soltas,
  -- em vez de levá-las junto
  album_id uuid references public.mural_albuns (id) on delete set null,
  autor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index mural_fotos_tempo_idx on public.mural_fotos (created_at desc);
create index mural_fotos_album_idx on public.mural_fotos (album_id, created_at desc);

alter table public.mural_albuns enable row level security;
alter table public.mural_fotos enable row level security;

-- álbum é organização coletiva: criar, renomear e apagar são livres
create policy mural_albuns_all on public.mural_albuns
  for all to authenticated using (true) with check (true);

create policy mural_fotos_select on public.mural_fotos
  for select to authenticated using (true);

create policy mural_fotos_insert on public.mural_fotos
  for insert to authenticated with check (autor_id = public.meu_perfil_id());

-- update livre é como a foto muda de álbum, inclusive por quem não a subiu
create policy mural_fotos_update on public.mural_fotos
  for update to authenticated using (true) with check (true);

create policy mural_fotos_delete on public.mural_fotos
  for delete to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('mural', 'mural', false)
on conflict (id) do nothing;

create policy mural_storage_read on storage.objects
  for select to authenticated using (bucket_id = 'mural');

create policy mural_storage_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'mural');

create policy mural_storage_delete on storage.objects
  for delete to authenticated using (bucket_id = 'mural');
