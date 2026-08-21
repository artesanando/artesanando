-- RA e nível da integrante.
--
-- O RA só pode ser lido pela dona ou por administradora, e o PostgREST não faz
-- RLS por coluna — então ele NÃO entra em `profiles`, senão qualquer
-- `select('*')` de qualquer tela vazaria o RA de todo mundo. Mora em tabela
-- própria, com policy própria.
--
-- O nível não é segredo: define a meta do semestre e precisa ser lido por quem
-- monta o relatório. Fica em `profiles` mesmo.

create table public.perfis_academico (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  ra text check (ra ~ '^[0-9]{6}$')
);

alter table public.perfis_academico enable row level security;

create policy academico_read on public.perfis_academico
  for select to authenticated
  using (profile_id = public.meu_perfil_id() or public.is_admin());

-- só a dona escreve: administradora vê o RA de todas, mas não digita por ninguém
create policy academico_write on public.perfis_academico
  for all to authenticated
  using (profile_id = public.meu_perfil_id())
  with check (profile_id = public.meu_perfil_id());

alter table public.profiles
  add column nivel text not null default 'iniciante'
    check (nivel in ('iniciante', 'experiente'));

-- O guard travava tudo que não fosse `usuario` para não-admin. O nível é
-- escolha da própria integrante — a trava contra troca oportunista é a
-- auditoria (ver 20260820120200), não o bloqueio.
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
      or new.desde is distinct from old.desde
      or new.user_id is distinct from old.user_id then
      raise exception 'apenas administradoras alteram papel, ativo, desde ou a conta vinculada';
    end if;

    -- trocar o usuário ou o nível: só o dono do próprio perfil
    if (new.usuario is distinct from old.usuario or new.nivel is distinct from old.nivel)
      and old.id is distinct from public.meu_perfil_id() then
      raise exception 'só a própria integrante troca o usuário e o nível dela';
    end if;
  end if;
  return new;
end;
$$;
