-- Convidar uma integrante que JÁ existe como perfil sem conta criava um segundo
-- perfil: o convite ia com nome e usuário novos, e handle_new_user só sabia
-- procurar por usuário/email iguais — que nunca batiam, porque quem entrou pela
-- chamada tem usuário gerado (`ada.lovelace.k3f9`). A ficha antiga, com as
-- presenças, ficava órfã.
--
-- Agora o convite carrega `perfil_id` no metadata e o trigger liga a conta
-- àquele perfil, sem adivinhação. A busca por usuário/email continua como plano
-- B para quem se cadastrar por fora do fluxo de convite.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario text := coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1));
  v_pedido uuid := nullif(new.raw_user_meta_data ->> 'perfil_id', '')::uuid;
  v_perfil uuid;
begin
  -- 1. o convite disse exatamente a qual perfil ligar
  if v_pedido is not null then
    select p.id into v_perfil
      from public.profiles p
     where p.id = v_pedido and p.user_id is null;
  end if;

  -- 2. senão, tenta reconhecer por usuário ou email
  if v_perfil is null then
    select p.id into v_perfil
      from public.profiles p
     where p.user_id is null
       and (lower(p.usuario) = lower(v_usuario) or lower(p.email) = lower(new.email))
     order by (lower(p.usuario) = lower(v_usuario)) desc
     limit 1;
  end if;

  if v_perfil is not null then
    update public.profiles
       set user_id = new.id,
           email = new.email,
           ativo = true,
           nome = coalesce(new.raw_user_meta_data ->> 'nome', nome),
           usuario = coalesce(new.raw_user_meta_data ->> 'usuario', usuario),
           telefone = coalesce(new.raw_user_meta_data ->> 'telefone', telefone),
           preferencia = coalesce(new.raw_user_meta_data ->> 'preferencia', preferencia),
           papel = coalesce(new.raw_user_meta_data ->> 'papel', papel)
     where id = v_perfil;
    return new;
  end if;

  insert into public.profiles (nome, usuario, email, telefone, preferencia, avatar_color, papel, desde, user_id)
  values (
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    v_usuario,
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
