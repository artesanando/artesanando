-- A integrante passa a poder trocar o próprio nome de usuário.
--
-- O guard travava `usuario` para qualquer não-admin, inclusive para a dona do
-- perfil — mas usuário é como ela se identifica, e o login por usuário aceita o
-- novo valor na hora. Papel, ativo, desde e a conta vinculada continuam sendo
-- coisa de administradora.

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

    -- trocar o usuário: só o dono do próprio perfil
    if new.usuario is distinct from old.usuario and old.id is distinct from public.meu_perfil_id() then
      raise exception 'só a própria integrante troca o nome de usuário dela';
    end if;
  end if;
  return new;
end;
$$;
