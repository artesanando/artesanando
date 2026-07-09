-- M1: pessoas, permissões e semestres + helpers de roles

-- ---------- Tabelas ----------

create table public.semestres (
  id uuid primary key default gen_random_uuid(),
  label text not null unique, -- ex.: '2026.2'
  inicio date,
  fim date,
  ativo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  usuario text not null unique, -- ex.: 'candi.nunes'
  telefone text,
  preferencia text not null default 'ambos' check (preferencia in ('croche', 'trico', 'ambos')),
  avatar_color text not null default '#C4798A',
  papel text not null default 'integrante' check (papel in ('admin', 'integrante')),
  ativo boolean not null default true,
  desde text, -- semestre de entrada, ex.: '2025.1'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissoes (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  progresso boolean not null default true,
  devolucoes boolean not null default true,
  comentarios boolean not null default true,
  financeiro boolean not null default false
);

-- ---------- Triggers ----------

-- cria profile + permissões quando um usuário entra no auth (signup, invite ou seed)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, usuario, telefone, preferencia, avatar_color, papel, desde)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'preferencia', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#C4798A'),
    coalesce(new.raw_user_meta_data ->> 'papel', 'integrante'),
    new.raw_user_meta_data ->> 'desde'
  )
  on conflict (id) do nothing;
  insert into public.permissoes (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- atualiza updated_at quando um profile é alterado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- garante que apenas admins podem alterar papel, usuário, ativo ou desde
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.papel is distinct from old.papel
      or new.ativo is distinct from old.ativo
      or new.usuario is distinct from old.usuario
      or new.desde is distinct from old.desde then
      raise exception 'apenas administradoras alteram papel, usuário, ativo ou desde';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.papel = 'admin' and p.ativo
  );
$$;

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
      when 'comentarios' then pm.comentarios
      when 'financeiro' then pm.financeiro
      else false
    end
    from public.permissoes pm
    where pm.profile_id = auth.uid()
  ), false);
$$;

create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profile_update();

-- retorna o email do usuário dado o nome de usuário (usado em src\state\auth.tsx:81)
create or replace function public.email_por_usuario(usuario_input text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.usuario) = lower(usuario_input);
$$;

-- ---------- Roles ----------

alter table public.profiles enable row level security;
alter table public.permissoes enable row level security;
alter table public.semestres enable row level security;

-- leitura: qualquer autenticada
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy permissoes_select on public.permissoes
  for select to authenticated using (true);
create policy semestres_select on public.semestres
  for select to authenticated using (true);

-- profiles: a própria linha (campos de perfil, vigiado pelo trigger) ou admin
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy profiles_insert_admin on public.profiles
  for insert to authenticated with check (public.is_admin());
create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.is_admin());

-- permissoes e semestres: escrita só admin
create policy permissoes_insert_admin on public.permissoes
  for insert to authenticated with check (public.is_admin());
create policy permissoes_update_admin on public.permissoes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy permissoes_delete_admin on public.permissoes
  for delete to authenticated using (public.is_admin());

create policy semestres_write_admin on public.semestres
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
