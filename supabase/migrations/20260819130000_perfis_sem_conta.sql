-- Integrantes que existem só para a chamada, sem conta de acesso.
--
-- Até aqui `profiles.id` ERA o id do `auth.users` (FK direta), então uma pessoa só
-- podia existir se tivesse login. Agora `id` é independente e o vínculo com a conta
-- vira a coluna `user_id`, que pode ser nula. Perfil sem conta é perfil com
-- `user_id is null`; quando a pessoa for convidada, o trigger liga a conta ao perfil
-- que já existe, preservando presenças e produção registradas antes.
--
-- Consequência: tudo que comparava `auth.uid()` com um id de perfil passa a usar
-- `public.meu_perfil_id()`.

-- ---------- Colunas ----------

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

alter table public.profiles
  add column user_id uuid unique references auth.users (id) on delete set null,
  add column email text,
  add column avatar_url text;

-- hoje id == auth.users.id para todo mundo que existe
update public.profiles set user_id = id;

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.user_id;

create index profiles_user_id_idx on public.profiles (user_id);
create index profiles_sem_conta_idx on public.profiles (nome) where user_id is null;

-- ---------- Helper ----------

-- id do PERFIL de quem está chamando (≠ auth.uid(), que é o id da CONTA)
create or replace function public.meu_perfil_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.profiles p where p.user_id = auth.uid();
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
    where p.user_id = auth.uid() and p.papel = 'admin' and p.ativo
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
    where pm.profile_id = public.meu_perfil_id()
  ), false);
$$;

create or replace function public.email_por_usuario(usuario_input text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where lower(p.usuario) = lower(usuario_input);
$$;

-- ---------- Triggers ----------

-- Toda linha de profiles nasce com permissões, tenha conta ou não.
create or replace function public.cria_permissoes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.permissoes (profile_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger profiles_cria_permissoes
after insert on public.profiles
for each row execute function public.cria_permissoes();

insert into public.permissoes (profile_id)
select p.id from public.profiles p
on conflict do nothing;

-- Conta nova no auth: liga a um perfil que já exista (mesmo usuário ou mesmo email),
-- senão cria um novo. É o que promove "só chamada" a integrante com acesso.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_novo text := coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1));
  perfil_id uuid;
begin
  select p.id into perfil_id
    from public.profiles p
   where p.user_id is null
     and (lower(p.usuario) = lower(usuario_novo) or lower(p.email) = lower(new.email))
   order by (lower(p.usuario) = lower(usuario_novo)) desc
   limit 1;

  if perfil_id is not null then
    update public.profiles
       set user_id = new.id,
           email = new.email,
           ativo = true,
           papel = coalesce(new.raw_user_meta_data ->> 'papel', papel)
     where id = perfil_id;
    return new;
  end if;

  insert into public.profiles (nome, usuario, email, telefone, preferencia, avatar_color, papel, desde, user_id)
  values (
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    usuario_novo,
    new.email,
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'preferencia', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#C4798A'),
    coalesce(new.raw_user_meta_data ->> 'papel', 'integrante'),
    new.raw_user_meta_data ->> 'desde',
    new.id
  );
  return new;
end;
$$;

-- guard_profile_update comparava papel/ativo/usuario/desde; agora protege user_id também
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
      or new.desde is distinct from old.desde
      or new.user_id is distinct from old.user_id then
      raise exception 'apenas administradoras alteram papel, usuário, ativo, desde ou a conta vinculada';
    end if;
  end if;
  return new;
end;
$$;

-- faixa concluída: comparar com o PERFIL, não com a conta
create or replace function public.guard_faixa_feita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'feita' and not public.is_admin()
    and old.responsavel_id is distinct from public.meu_perfil_id()
    and (new.cores is distinct from old.cores or new.ordem is distinct from old.ordem) then
    raise exception 'faixa concluída não pode ser editada';
  end if;
  return new;
end;
$$;

-- ---------- Policies que comparavam auth.uid() com id de perfil ----------

drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = public.meu_perfil_id() or public.is_admin())
  with check (id = public.meu_perfil_id() or public.is_admin());

drop policy comentarios_insert on public.comentarios;
create policy comentarios_insert on public.comentarios
  for insert to authenticated
  with check (public.has_perm('comentarios') and autor_id = public.meu_perfil_id());

drop policy comentarios_update on public.comentarios;
create policy comentarios_update on public.comentarios
  for update to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin())
  with check (autor_id = public.meu_perfil_id() or public.is_admin());

drop policy comentarios_delete on public.comentarios;
create policy comentarios_delete on public.comentarios
  for delete to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin());

drop policy atividades_insert on public.atividades;
create policy atividades_insert on public.atividades
  for insert to authenticated with check (autor_id = public.meu_perfil_id());

drop policy receitas_insert on public.receitas;
create policy receitas_insert on public.receitas
  for insert to authenticated with check (criado_por = public.meu_perfil_id());

drop policy receitas_update on public.receitas;
create policy receitas_update on public.receitas
  for update to authenticated
  using (criado_por = public.meu_perfil_id() or public.is_admin())
  with check (criado_por = public.meu_perfil_id() or public.is_admin());

drop policy receitas_delete on public.receitas;
create policy receitas_delete on public.receitas
  for delete to authenticated
  using (criado_por = public.meu_perfil_id() or public.is_admin());
