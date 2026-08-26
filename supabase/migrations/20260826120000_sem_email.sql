-- O projeto não usa email para nada: ninguém recebe convite, aviso ou link por
-- email, e o campo só dava trabalho na hora de cadastrar integrante.
--
-- O Auth do Supabase, porém, exige um email para guardar conta com senha. Ele
-- vira um identificador interno — `usuario@artesanando.local`, domínio que não
-- existe de propósito — montado pela Edge Function na hora do convite. Não
-- aparece em tela nenhuma e não recebe mensagem nenhuma.
--
-- Quem já tinha conta com email de verdade continua entrando: o login procura
-- pelo usuário e usa o identificador que estiver gravado, seja qual for.

-- Login continua sendo por usuário; o que a função devolve é o identificador
-- interno da conta, não um endereço para onde se escreve.
drop function if exists public.email_por_usuario(text);

create or replace function public.login_por_usuario(usuario_input text)
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

-- O trigger espelhava o email da conta em profiles.email. Sem a coluna, o que
-- liga conta a perfil é o id pedido no convite ou o nome de usuário.
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
  if v_pedido is not null then
    select p.id into v_perfil
      from public.profiles p
     where p.id = v_pedido and p.user_id is null;
  end if;

  if v_perfil is null then
    select p.id into v_perfil
      from public.profiles p
     where p.user_id is null
       and lower(p.usuario) = lower(v_usuario)
     limit 1;
  end if;

  if v_perfil is not null then
    update public.profiles
       set user_id = new.id,
           ativo = true,
           nome = coalesce(new.raw_user_meta_data ->> 'nome', nome),
           usuario = coalesce(new.raw_user_meta_data ->> 'usuario', usuario),
           telefone = coalesce(new.raw_user_meta_data ->> 'telefone', telefone),
           preferencia = coalesce(new.raw_user_meta_data ->> 'preferencia', preferencia),
           turno = coalesce(new.raw_user_meta_data ->> 'turno', turno),
           papel = coalesce(new.raw_user_meta_data ->> 'papel', papel)
     where id = v_perfil;
    return new;
  end if;

  insert into public.profiles (
    nome, usuario, telefone, preferencia, turno, avatar_color, papel, desde, user_id
  )
  values (
    coalesce(new.raw_user_meta_data ->> 'nome', v_usuario),
    v_usuario,
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'preferencia', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'turno', 'ambos'),
    public.cor_de_avatar(),
    coalesce(new.raw_user_meta_data ->> 'papel', 'integrante'),
    new.raw_user_meta_data ->> 'desde',
    new.id
  );
  return new;
end;
$$;

alter table public.profiles drop column if exists email;
